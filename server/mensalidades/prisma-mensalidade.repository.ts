import type { Prisma, PrismaClient } from "@/lib/generated/prisma/client";
import { SituacaoDiaria, StatusMensalidade } from "@/lib/generated/prisma/enums";
import { centavosParaDecimal, decimalParaCentavos } from "@/lib/dinheiro";
import { somarDias } from "@/lib/datas";
import type {
  IMensalidadeRepository,
  Mensalidade,
  MensalidadeComDiarias,
  NovaMensalidade,
  ResultadoIsencao,
} from "./mensalidade.repository";

const aluno = { select: { usuario: { select: { nome: true } } } } as const;

type MensalidadePrisma = Prisma.MensalidadeGetPayload<{ include: { aluno: typeof aluno } }>;

function paraEntidade({ aluno: a, ...m }: MensalidadePrisma): Mensalidade {
  return { ...m, alunoNome: a.usuario.nome };
}

export class PrismaMensalidadeRepository implements IMensalidadeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async listar(filtro: { competencia?: string; status?: StatusMensalidade; alunoId?: string }) {
    const lista = await this.prisma.mensalidade.findMany({
      where: filtro,
      include: { aluno },
      orderBy: [{ competencia: "desc" }, { aluno: { usuario: { nome: "asc" } } }],
    });
    return lista.map(paraEntidade);
  }

  async buscarPorId(id: string): Promise<MensalidadeComDiarias | null> {
    const m = await this.prisma.mensalidade.findUnique({
      where: { id },
      include: {
        aluno,
        diarias: {
          orderBy: { data: "asc" },
          include: { viagem: { select: { rota: { select: { nome: true } } } } },
        },
      },
    });
    if (!m) return null;
    const { diarias, ...resto } = m;
    return {
      ...paraEntidade(resto),
      diarias: diarias.map((d) => ({
        id: d.id,
        viagemId: d.viagemId,
        data: d.data,
        valorDiaria: d.valorDiaria,
        situacao: d.situacao,
        avulsa: d.planoRotaId === null,
        rotaNome: d.viagem.rota.nome,
      })),
    };
  }

  async competencias() {
    const linhas = await this.prisma.mensalidade.findMany({
      distinct: ["competencia"],
      select: { competencia: true },
      orderBy: { competencia: "desc" },
    });
    return linhas.map((l) => l.competencia);
  }

  async existeCompetencia(competencia: string) {
    return (await this.prisma.mensalidade.count({ where: { competencia } })) > 0;
  }

  async dadosParaApuracao(de: Date, ate: Date) {
    const viagens = await this.prisma.viagem.findMany({
      where: { data: { gte: de, lt: ate } },
      select: {
        id: true,
        rotaId: true,
        data: true,
        prazoDeclaracao: true,
        status: true,
        rota: { select: { valorDiaria: true } },
      },
    });
    const rotaIds = [...new Set(viagens.map((v) => v.rotaId))];
    const [planos, declaracoes] = await Promise.all([
      this.prisma.planoRota.findMany({
        where: {
          rotaId: { in: rotaIds },
          vigenteDe: { lt: ate },
          OR: [{ vigenteAte: null }, { vigenteAte: { gte: somarDias(de, -1) } }],
        },
        include: { aluno: { select: { usuario: { select: { nome: true } } } } },
      }),
      this.prisma.declaracao.findMany({
        where: { viagemId: { in: viagens.map((v) => v.id) } },
        include: {
          aluno: { select: { usuario: { select: { nome: true } } } },
          justificativa: { select: { id: true, status: true } },
        },
      }),
    ]);

    return {
      viagens: viagens.map(({ rota, ...v }) => ({ ...v, valorDiaria: rota.valorDiaria })),
      planos: planos.map(({ aluno: a, ...p }) => ({ ...p, alunoNome: a.usuario.nome })),
      declaracoes: declaracoes.map(({ aluno: a, ...d }) => ({ ...d, alunoNome: a.usuario.nome })),
    };
  }

  async criarEmLote(mensalidades: NovaMensalidade[]) {
    // Uma transação: ou a competência inteira fecha, ou nada fecha.
    await this.prisma.$transaction(
      mensalidades.map(({ diarias, ...m }) =>
        this.prisma.mensalidade.create({ data: { ...m, diarias: { create: diarias } } }),
      ),
    );
  }

  async ajustar(id: string, dados: { ajuste: string | null; motivo: string | null; por: string; valor: string }) {
    await this.prisma.mensalidade.update({
      where: { id },
      data: {
        ajuste: dados.ajuste,
        motivoAjuste: dados.motivo,
        ajustadoPor: dados.por,
        ajustadoEm: new Date(),
        valor: dados.valor,
      },
    });
  }

  async darBaixa(id: string, dados: { pagoEm: Date; referencia: string; por: string }) {
    await this.prisma.mensalidade.update({
      where: { id },
      data: {
        status: StatusMensalidade.PAGA,
        pagoEm: dados.pagoEm,
        referenciaGateway: dados.referencia,
        baixaPor: dados.por,
        baixaEm: new Date(),
      },
    });
  }

  async marcarVencidas(agora: Date) {
    await this.prisma.mensalidade.updateMany({
      where: { status: StatusMensalidade.ABERTA, vencimentoEm: { lt: agora } },
      data: { status: StatusMensalidade.VENCIDA },
    });
  }

  async isentarDiaria(viagemId: string, alunoId: string, justificativaId: string): Promise<ResultadoIsencao> {
    return this.prisma.$transaction(async (tx) => {
      const diaria = await tx.diaria.findFirst({
        where: { viagemId, mensalidade: { alunoId } },
        include: { mensalidade: true },
      });
      if (!diaria || diaria.situacao !== SituacaoDiaria.COBRADA) return "SEM_COBRANCA";
      if (diaria.mensalidade.status === StatusMensalidade.PAGA) return "MENSALIDADE_PAGA";

      await tx.diaria.update({
        where: { id: diaria.id },
        data: { situacao: SituacaoDiaria.ISENTA_JUSTIFICADA, justificativaId },
      });
      // Totais sempre recalculados a partir das diárias — nunca "na mão".
      const diarias = await tx.diaria.findMany({ where: { mensalidadeId: diaria.mensalidadeId } });
      const cobradas = diarias.filter((d) => d.situacao === SituacaoDiaria.COBRADA);
      const subtotal = cobradas.reduce((t, d) => t + decimalParaCentavos(d.valorDiaria.toString()), 0);
      const ajuste = diaria.mensalidade.ajuste ? decimalParaCentavos(diaria.mensalidade.ajuste.toString()) : 0;
      await tx.mensalidade.update({
        where: { id: diaria.mensalidadeId },
        data: {
          diariasCobradas: cobradas.length,
          diariasIsentas: diarias.length - cobradas.length,
          subtotal: centavosParaDecimal(subtotal),
          valor: centavosParaDecimal(Math.max(0, subtotal + ajuste)),
        },
      });
      return "ISENTADA";
    });
  }

  async nomesDeUsuarios(ids: string[]) {
    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: ids } },
      select: { id: true, nome: true },
    });
    return new Map(usuarios.map((u) => [u.id, u.nome]));
  }
}
