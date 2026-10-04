// Regras de rotas. A rota é ida e volta: os pontos estão na ordem da ida e a
// volta percorre a lista ao contrário. Quase toda regra de edição existe para
// não deixar um plano em vigor inconsistente.
import { StatusVeiculo } from "@/lib/generated/prisma/enums";
import { descreverDias, horarioLocal, nomeDiaLongo } from "@/lib/datas";
import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import { contarPorDia, picoDeOcupacao } from "@/server/planos/ocupacao";
import type { IPlanoRepository, Plano } from "@/server/planos/plano.repository";
import type { IPontoRepository } from "@/server/pontos/ponto.repository";
import type { IVeiculoRepository } from "@/server/veiculos/veiculo.repository";
import { atualizarRotaSchema, criarRotaSchema, paraRotaDTO, type RotaDTO } from "./rota.dto";
import type { IRotaRepository, Rota } from "./rota.repository";

export class RotaService {
  constructor(
    private readonly rotas: IRotaRepository,
    private readonly veiculos: IVeiculoRepository,
    private readonly pontos: IPontoRepository,
    private readonly planos: IPlanoRepository,
  ) {}

  async listar(): Promise<RotaDTO[]> {
    return (await this.rotas.listar()).map(paraRotaDTO);
  }

  async buscar(id: string): Promise<RotaDTO> {
    return paraRotaDTO(await this.obter(id));
  }

  /** Quantos planos em vigor cobrem cada dia de operação, contra a capacidade. */
  async ocupacao(id: string) {
    const rota = await this.obter(id);
    const planos = await this.planos.listarAbertosDaRota(id);
    return {
      capacidade: rota.veiculo.capacidade,
      porDia: contarPorDia(planos, rota.diasOperacao),
    };
  }

  async criar(entrada: unknown, criadoPor: string): Promise<RotaDTO> {
    const dados = validar(criarRotaSchema, entrada);
    await this.garantirVeiculoAtivo(dados.veiculoId);
    await this.garantirPontosAtivos(dados.pontos);
    return paraRotaDTO(await this.rotas.criar({ ...dados, criadoPor }));
  }

  async atualizar(id: string, entrada: unknown): Promise<RotaDTO> {
    const atual = await this.obter(id);
    const dados = validar(atualizarRotaSchema, entrada);
    const planos = await this.planos.listarAbertosDaRota(id);

    this.garantirVoltaDepoisDaIda(atual, dados);

    const trocouVeiculo = dados.veiculoId !== undefined && dados.veiculoId !== atual.veiculoId;
    if (trocouVeiculo) {
      const veiculo = await this.garantirVeiculoAtivo(dados.veiculoId!);
      this.garantirCapacidade(veiculo, planos);
    }
    if (dados.diasOperacao) this.garantirDiasDosPlanos(dados.diasOperacao, planos);
    if (dados.pontos) {
      await this.garantirPontosAtivos(dados.pontos);
      this.garantirTrajetoDosPlanos(dados.pontos, planos);
    }
    if (dados.ativa === false && atual.ativa && planos.length > 0) {
      throw new ErroDeValidacao(
        `A rota tem ${planos.length} plano(s) em vigor. Encerre os planos antes de desativá-la.`,
        { ativa: ["Rota com planos em vigor."] },
      );
    }
    if (dados.ativa === true && !atual.ativa) {
      await this.garantirVeiculoAtivo(dados.veiculoId ?? atual.veiculoId);
      await this.garantirPontosAtivos(dados.pontos ?? atual.pontos.map((p) => p.id));
    }

    // Mudou algo que define as viagens: as futuras ainda vazias são refeitas.
    const replanejarViagens =
      trocouVeiculo ||
      dados.horarioIda !== undefined ||
      dados.horarioVolta !== undefined ||
      dados.diasOperacao !== undefined ||
      dados.antecedenciaMinutos !== undefined ||
      dados.ativa === false;

    return paraRotaDTO(await this.rotas.atualizar(id, dados, { replanejarViagens }));
  }

  // ---------------------------------------------------------------- Regras

  private async obter(id: string): Promise<Rota> {
    const rota = await this.rotas.buscarPorId(id);
    if (!rota) throw new ErroNaoEncontrado("Rota não encontrada.");
    return rota;
  }

  /** No PATCH pode vir só um dos horários: compara com o que já está gravado. */
  private garantirVoltaDepoisDaIda(atual: Rota, dados: { horarioIda?: string; horarioVolta?: string }) {
    const ida = dados.horarioIda ?? horarioLocal(atual.horarioIda);
    const volta = dados.horarioVolta ?? horarioLocal(atual.horarioVolta);
    if (volta <= ida) {
      throw new ErroDeValidacao("A volta precisa ser depois da ida.", {
        horarioVolta: ["A volta precisa ser depois da ida."],
      });
    }
  }

  /** O veículo padrão precisa estar rodando: não se monta rota com veículo parado. */
  private async garantirVeiculoAtivo(veiculoId: string) {
    const veiculo = await this.veiculos.buscarPorId(veiculoId);
    if (!veiculo) {
      throw new ErroDeValidacao("Veículo não encontrado.", { veiculoId: ["Escolha um veículo da lista."] });
    }
    if (veiculo.status !== StatusVeiculo.ATIVO) {
      throw new ErroDeValidacao(`O veículo ${veiculo.placa} não está ativo.`, {
        veiculoId: ["Escolha um veículo ativo."],
      });
    }
    return veiculo;
  }

  /** Trocar por um veículo menor não pode deixar alunos já contratados sem lugar. */
  private garantirCapacidade(veiculo: { placa: string; capacidade: number }, planos: Plano[]) {
    const pico = picoDeOcupacao(planos);
    if (pico > veiculo.capacidade) {
      throw new ErroDeValidacao(
        `A rota tem dias com ${pico} alunos contratados e o ${veiculo.placa} comporta ${veiculo.capacidade}.`,
        { veiculoId: [`Capacidade insuficiente: são ${pico} alunos no dia mais cheio.`] },
      );
    }
  }

  private async garantirPontosAtivos(ids: string[]) {
    const ativos = new Set((await this.pontos.listarAtivos()).map((p) => p.id));
    if (ids.some((id) => !ativos.has(id))) {
      throw new ErroDeValidacao("O trajeto tem ponto inexistente ou inativo.", {
        pontos: ["Use apenas pontos ativos."],
      });
    }
  }

  /** Não tira da operação um dia que algum aluno contratou. */
  private garantirDiasDosPlanos(dias: number[], planos: Plano[]) {
    const removidosEmUso = [...new Set(planos.flatMap((p) => p.diasSemana))].filter((d) => !dias.includes(d));
    if (removidosEmUso.length > 0) {
      throw new ErroDeValidacao(
        `Há alunos contratados para ${removidosEmUso.map((d) => nomeDiaLongo[d]).join(", ")}. Altere os planos antes.`,
        { diasOperacao: [`Dias em uso por planos: ${descreverDias(removidosEmUso)}.`] },
      );
    }
  }

  /**
   * O novo trajeto precisa continuar servindo cada plano em vigor: os pontos do
   * plano seguem na rota, o destino vem depois do embarque, e o retorno (onde
   * desce na volta) vem antes do destino — a volta anda ao contrário.
   */
  private garantirTrajetoDosPlanos(trajeto: string[], planos: Plano[]) {
    const ordem = new Map(trajeto.map((id, i) => [id, i]));
    const quebrados = planos.filter((p) => {
      const embarque = ordem.get(p.pontoEmbarqueId);
      const destino = ordem.get(p.pontoDestinoId);
      const retorno = ordem.get(p.pontoRetornoId ?? p.pontoEmbarqueId);
      return (
        embarque === undefined ||
        destino === undefined ||
        retorno === undefined ||
        destino <= embarque ||
        retorno >= destino
      );
    });
    if (quebrados.length > 0) {
      throw new ErroDeValidacao(
        `O novo trajeto não atende o plano de: ${quebrados.map((p) => p.aluno.nome).join(", ")}.`,
        { pontos: ["Mantenha os pontos usados pelos planos, na mesma ordem relativa."] },
      );
    }
  }
}
