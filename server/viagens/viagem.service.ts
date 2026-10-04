// Viagens: geradas sob demanda (ao abrir a agenda) para os próximos 14 dias —
// sem job agendado. A lista de quem vai sai de esperados.ts.
import { z } from "zod";
import { StatusVeiculo, StatusViagem } from "@/lib/generated/prisma/enums";
import { dataDeIso, dataIso, hojeLocal, horarioLocal, somarDias } from "@/lib/datas";
import { idObrigatorio, textoObrigatorio } from "@/lib/esquemas/comum";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IVeiculoRepository } from "@/server/veiculos/veiculo.repository";
import { calcularEsperados, movimentoPorPonto } from "./esperados";
import type { IViagemRepository, Viagem } from "./viagem.repository";

export const HORIZONTE_DIAS = 14;

const cancelarSchema = z.object({ motivo: textoObrigatorio("motivo", 3, 200) });
const trocarVeiculoSchema = z.object({ veiculoId: idObrigatorio("Escolha o veículo.") });

export type ViagemResumoDTO = {
  id: string;
  data: string;
  rota: { id: string; nome: string };
  veiculo: { id: string; placa: string; modelo: string };
  horarioIda: string;
  horarioVolta: string;
  prazoDeclaracao: string;
  capacidade: number;
  status: StatusViagem;
  motivoCancelamento: string | null;
  ida: number;
  volta: number;
  ausentes: number;
  /** Mais esperados que lugares (ex.: veículo menor no dia). */
  acimaDaCapacidade: boolean;
};

function resumo(viagem: Viagem, contagem: { ida: number; volta: number; ausentes: number }): ViagemResumoDTO {
  return {
    id: viagem.id,
    data: dataIso(viagem.data),
    rota: { id: viagem.rota.id, nome: viagem.rota.nome },
    veiculo: viagem.veiculo,
    horarioIda: horarioLocal(viagem.horarioIda),
    horarioVolta: horarioLocal(viagem.horarioVolta),
    prazoDeclaracao: viagem.prazoDeclaracao.toISOString(),
    capacidade: viagem.capacidade,
    status: viagem.status,
    motivoCancelamento: viagem.motivoCancelamento,
    ...contagem,
    acimaDaCapacidade: Math.max(contagem.ida, contagem.volta) > viagem.capacidade,
  };
}

export class ViagemService {
  constructor(
    private readonly viagens: IViagemRepository,
    private readonly veiculos: IVeiculoRepository,
  ) {}

  /** Garante as viagens de hoje até o horizonte. Barato e idempotente. */
  async garantirProximas(agora = new Date()) {
    const hoje = hojeLocal(agora);
    await this.viagens.gerar(hoje, somarDias(hoje, HORIZONTE_DIAS), agora);
  }

  /** Viagens de um dia ("AAAA-MM-DD"), com a contagem de esperados. */
  async listarDoDia(dia: string): Promise<ViagemResumoDTO[]> {
    await this.garantirProximas();
    const data = dataDeIso(dia);
    const viagens = await this.viagens.listar({ de: data, ate: data });
    if (viagens.length === 0) return [];

    const rotaIds = [...new Set(viagens.map((v) => v.rotaId))];
    const [planos, declaracoes] = await Promise.all([
      this.viagens.listarPlanos(rotaIds, data, data),
      this.viagens.listarDeclaracoes(viagens.map((v) => v.id)),
    ]);
    return viagens.map((v) => {
      const e = calcularEsperados(v, planos, declaracoes);
      return resumo(v, { ida: e.ida, volta: e.volta, ausentes: e.ausentes.length });
    });
  }

  /** Detalhe para a operação: passageiros, ausentes e o que acontece em cada ponto. */
  async detalhar(id: string) {
    const viagem = await this.obter(id);
    const [planos, declaracoes] = await Promise.all([
      this.viagens.listarPlanos([viagem.rotaId], viagem.data, viagem.data),
      this.viagens.listarDeclaracoes([viagem.id]),
    ]);
    const esperados = calcularEsperados(viagem, planos, declaracoes);
    const descricao = new Map(viagem.rota.pontos.map((p) => [p.id, p.descricao]));

    return {
      ...resumo(viagem, { ida: esperados.ida, volta: esperados.volta, ausentes: esperados.ausentes.length }),
      passageiros: esperados.passageiros.map((p) => ({
        ...p,
        embarque: descricao.get(p.embarqueId) ?? "—",
        destino: descricao.get(p.destinoId) ?? "—",
        retorno: descricao.get(p.retornoId) ?? "—",
      })),
      ausentesLista: esperados.ausentes,
      pontos: movimentoPorPonto(viagem.rota.pontos, esperados.passageiros),
    };
  }

  /**
   * Cancela a viagem inteira (quebra, feriado, greve). Afeta todo mundo: no
   * fechamento do mês a diária do dia vira ISENTA_VIAGEM_CANCELADA. Aula
   * cancelada de um aluno não é isto — é justificativa individual.
   */
  async cancelar(id: string, entrada: unknown) {
    const { motivo } = validar(cancelarSchema, entrada);
    const viagem = await this.obter(id);
    if (viagem.status !== StatusViagem.AGENDADA) {
      throw new ErroDeValidacao("Só viagens agendadas podem ser canceladas.");
    }
    await this.viagens.cancelar(id, motivo);
  }

  /**
   * Troca o veículo só desta viagem (o padrão da rota não muda). Se o veículo
   * do dia for menor que os esperados, a troca é aceita — a viagem precisa
   * sair — mas fica marcada como acima da capacidade para o admin agir.
   */
  async trocarVeiculo(id: string, entrada: unknown) {
    const { veiculoId } = validar(trocarVeiculoSchema, entrada);
    const viagem = await this.obter(id);
    if (viagem.status !== StatusViagem.AGENDADA) {
      throw new ErroDeValidacao("Só viagens agendadas podem trocar de veículo.");
    }
    const veiculo = await this.veiculos.buscarPorId(veiculoId);
    if (!veiculo || veiculo.status !== StatusVeiculo.ATIVO) {
      throw new ErroDeValidacao("Escolha um veículo ativo.", { veiculoId: ["Escolha um veículo ativo."] });
    }
    await this.viagens.trocarVeiculo(id, veiculo);
  }

  private async obter(id: string): Promise<Viagem> {
    const viagem = await this.viagens.buscarPorId(id);
    if (!viagem) throw new ErroNaoEncontrado("Viagem não encontrada.");
    return viagem;
  }
}
