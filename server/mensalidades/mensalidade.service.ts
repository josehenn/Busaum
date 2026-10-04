// Mensalidade = soma das diárias do mês, fechada DEPOIS do fim da competência
// (antes disso os dias ainda não aconteceram). Vence no dia 10 do mês seguinte.
import { SituacaoDiaria, StatusMensalidade } from "@/lib/generated/prisma/enums";
import {
  competenciaDe,
  dataIso,
  dia,
  fimDaCompetencia,
  formatarCompetencia,
  hojeLocal,
  horaLocal,
  inicioDaCompetencia,
  somarDias,
} from "@/lib/datas";
import { centavosParaDecimal, decimalParaCentavos } from "@/lib/dinheiro";
import {
  ajustarMensalidadeSchema,
  fecharCompetenciaSchema,
  filtroMensalidadesSchema,
} from "@/lib/esquemas/mensalidade";
import { ErroDeConflito, ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { PaymentGateway } from "@/server/pagamentos/payment-gateway";
import type { IViagemRepository } from "@/server/viagens/viagem.repository";
import { apurar } from "./apuracao";
import type { IMensalidadeRepository, Mensalidade, MensalidadeComDiarias } from "./mensalidade.repository";

export const DIA_VENCIMENTO = 10;

export type MensalidadeDTO = {
  id: string;
  aluno: { id: string; nome: string };
  competencia: string;
  diariasCobradas: number;
  diariasIsentas: number;
  subtotal: string;
  ajuste: string | null;
  motivoAjuste: string | null;
  valor: string;
  vencimentoEm: string;
  status: StatusMensalidade;
  pagoEm: string | null;
  referenciaGateway: string | null;
};

export type MensalidadeDetalheDTO = MensalidadeDTO & {
  ajustadoPor: string | null;
  ajustadoEm: string | null;
  baixaPor: string | null;
  diarias: {
    id: string;
    data: string;
    rota: string;
    valor: string;
    situacao: SituacaoDiaria;
    avulsa: boolean;
  }[];
};

const dec = (v: { toString(): string }) => Number(v.toString()).toFixed(2);

function paraDTO(m: Mensalidade): MensalidadeDTO {
  return {
    id: m.id,
    aluno: { id: m.alunoId, nome: m.alunoNome },
    competencia: m.competencia,
    diariasCobradas: m.diariasCobradas,
    diariasIsentas: m.diariasIsentas,
    subtotal: dec(m.subtotal),
    ajuste: m.ajuste === null ? null : dec(m.ajuste),
    motivoAjuste: m.motivoAjuste,
    valor: dec(m.valor),
    vencimentoEm: m.vencimentoEm.toISOString(),
    status: m.status,
    pagoEm: m.pagoEm?.toISOString() ?? null,
    referenciaGateway: m.referenciaGateway,
  };
}

/** "2026-09" → 10/10/2026 23:59 em Brasília. */
function vencimentoDa(competencia: string) {
  const fim = fimDaCompetencia(competencia);
  return horaLocal(dia(fim.getUTCFullYear(), fim.getUTCMonth() + 1, DIA_VENCIMENTO), "23:59");
}

export class MensalidadeService {
  constructor(
    private readonly mensalidades: IMensalidadeRepository,
    private readonly viagens: IViagemRepository,
    private readonly gateway: PaymentGateway,
  ) {}

  async listar(filtro: unknown = {}): Promise<MensalidadeDTO[]> {
    await this.mensalidades.marcarVencidas(new Date());
    const { competencia, status } = filtroMensalidadesSchema.parse(filtro);
    return (await this.mensalidades.listar({ competencia, status })).map(paraDTO);
  }

  async listarDoAluno(alunoId: string): Promise<MensalidadeDTO[]> {
    await this.mensalidades.marcarVencidas(new Date());
    return (await this.mensalidades.listar({ alunoId })).map(paraDTO);
  }

  async competencias() {
    return this.mensalidades.competencias();
  }

  /** Competências que já podem ser fechadas (meses passados) e ainda não foram. */
  async competenciasParaFechar(): Promise<string[]> {
    const atual = competenciaDe(hojeLocal());
    const fechadas = new Set(await this.mensalidades.competencias());
    // Últimos 6 meses: o suficiente para a operação, sem varrer o histórico todo.
    const candidatas: string[] = [];
    let inicio = inicioDaCompetencia(atual);
    for (let i = 0; i < 6; i++) {
      inicio = inicioDaCompetencia(competenciaDe(somarDias(inicio, -1)));
      candidatas.push(competenciaDe(inicio));
    }
    return candidatas.filter((c) => !fechadas.has(c));
  }

  /** Detalhe. Se `alunoId` vier, só devolve se a mensalidade for dele. */
  async detalhar(id: string, alunoId?: string): Promise<MensalidadeDetalheDTO> {
    await this.mensalidades.marcarVencidas(new Date());
    const m = await this.mensalidades.buscarPorId(id);
    if (!m || (alunoId && m.alunoId !== alunoId)) throw new ErroNaoEncontrado("Mensalidade não encontrada.");
    return this.paraDetalhe(m);
  }

  /**
   * Fecha a competência: gera uma mensalidade por aluno com dias previstos no
   * mês, cada dia virando uma diária. Idempotente pela regra "já fechada"
   * (e pelo @@unique alunoId+competencia no banco).
   */
  async fechar(entrada: unknown) {
    const { competencia } = validar(fecharCompetenciaSchema, entrada);
    if (competencia >= competenciaDe(hojeLocal())) {
      throw new ErroDeValidacao(
        `${formatarCompetencia(competencia)} ainda não terminou. Só dá para fechar meses passados.`,
        { competencia: ["Escolha um mês que já terminou."] },
      );
    }
    if (await this.mensalidades.existeCompetencia(competencia)) {
      throw new ErroDeConflito(`${formatarCompetencia(competencia)} já foi fechada.`);
    }

    const de = inicioDaCompetencia(competencia);
    const ate = fimDaCompetencia(competencia);
    // Viagens são geradas sob demanda: garante que o mês inteiro existe.
    await this.viagens.gerar(de, somarDias(ate, -1), new Date());

    const { viagens, planos, declaracoes } = await this.mensalidades.dadosParaApuracao(de, ate);
    const vencimentoEm = vencimentoDa(competencia);
    const novas = [];

    for (const [alunoId, diarias] of apurar(viagens, planos, declaracoes)) {
      const cobradas = diarias.filter((d) => d.situacao === SituacaoDiaria.COBRADA);
      // subtotal sempre = soma das COBRADA, nunca digitado.
      const subtotal = centavosParaDecimal(cobradas.reduce((t, d) => t + d.centavos, 0));
      const { referencia } = await this.gateway.registrarCobranca({
        competencia,
        alunoId,
        valor: subtotal,
        vencimentoEm,
      });
      novas.push({
        alunoId,
        competencia,
        diariasCobradas: cobradas.length,
        diariasIsentas: diarias.length - cobradas.length,
        subtotal,
        valor: subtotal,
        vencimentoEm,
        referenciaGateway: referencia,
        diarias: diarias.map(({ centavos, ...d }) => ({ ...d, valorDiaria: centavosParaDecimal(centavos) })),
      });
    }

    if (novas.length === 0) {
      throw new ErroDeValidacao(`Nenhum aluno teve dias previstos em ${formatarCompetencia(competencia)}.`);
    }
    await this.mensalidades.criarEmLote(novas);
    return { competencia, mensalidades: novas.length };
  }

  /**
   * Ajuste manual, sempre com motivo e assinatura. O subtotal nunca é editado:
   * valor = subtotal + ajuste. Resolve o mês com diária a corrigir, ou a
   * justificativa aprovada depois do pagamento (ajuste negativo no mês seguinte).
   */
  async ajustar(id: string, entrada: unknown, adminId: string) {
    const { ajuste, motivo } = validar(ajustarMensalidadeSchema, entrada);
    const m = await this.obterEditavel(id);

    const valor = decimalParaCentavos(m.subtotal.toString()) + (ajuste ? decimalParaCentavos(ajuste) : 0);
    if (valor < 0) {
      throw new ErroDeValidacao("O ajuste deixaria a mensalidade negativa.", {
        ajuste: [`O desconto máximo é o subtotal (${dec(m.subtotal)}).`],
      });
    }
    await this.mensalidades.ajustar(id, {
      ajuste,
      motivo: ajuste === null ? null : (motivo ?? null),
      por: adminId,
      valor: centavosParaDecimal(valor),
    });
  }

  /** Baixa manual: o admin registra que recebeu. PAGA não volta para ABERTA. */
  async darBaixa(id: string, adminId: string) {
    const m = await this.obterEditavel(id);
    const referencia = m.referenciaGateway ?? `MANUAL-${m.competencia}-${m.id.slice(-6)}`;
    const { pagoEm } = await this.gateway.confirmarPagamento(referencia);
    await this.mensalidades.darBaixa(id, { pagoEm, referencia, por: adminId });
  }

  private async obterEditavel(id: string) {
    const m = await this.mensalidades.buscarPorId(id);
    if (!m) throw new ErroNaoEncontrado("Mensalidade não encontrada.");
    if (m.status === StatusMensalidade.PAGA || m.status === StatusMensalidade.CANCELADA) {
      throw new ErroDeValidacao("Mensalidade paga ou cancelada não pode ser alterada.");
    }
    return m;
  }

  private async paraDetalhe(m: MensalidadeComDiarias): Promise<MensalidadeDetalheDTO> {
    const nomes = await this.mensalidades.nomesDeUsuarios(
      [m.ajustadoPor, m.baixaPor].filter((x): x is string => Boolean(x)),
    );
    return {
      ...paraDTO(m),
      ajustadoPor: m.ajustadoPor ? (nomes.get(m.ajustadoPor) ?? null) : null,
      ajustadoEm: m.ajustadoEm?.toISOString() ?? null,
      baixaPor: m.baixaPor ? (nomes.get(m.baixaPor) ?? null) : null,
      diarias: m.diarias.map((d) => ({
        id: d.id,
        data: dataIso(d.data),
        rota: d.rotaNome,
        valor: dec(d.valorDiaria),
        situacao: d.situacao,
        avulsa: d.avulsa,
      })),
    };
  }
}
