import { ErroDeValidacao, ErroNaoEncontrado } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IInstituicaoRepository } from "@/server/instituicoes/instituicao.repository";
import {
  atualizarPontoSchema,
  criarPontoSchema,
  filtroPontosSchema,
  paraPontoDTO,
  type PontoDTO,
} from "./ponto.dto";
import type { IPontoRepository, Ponto } from "./ponto.repository";

export class PontoService {
  constructor(
    private readonly pontos: IPontoRepository,
    private readonly instituicoes: IInstituicaoRepository,
  ) {}

  async listar(filtro: unknown = {}): Promise<PontoDTO[]> {
    const lista = await this.pontos.listar(filtroPontosSchema.parse(filtro));
    return lista.map(paraPontoDTO);
  }

  async listarAtivos(): Promise<PontoDTO[]> {
    return (await this.pontos.listarAtivos()).map(paraPontoDTO);
  }

  async buscar(id: string): Promise<PontoDTO> {
    return paraPontoDTO(await this.obter(id));
  }

  async criar(entrada: unknown, criadoPor: string): Promise<PontoDTO> {
    const dados = validar(criarPontoSchema, entrada);
    if (dados.instituicaoId) await this.garantirInstituicao(dados.instituicaoId);
    return paraPontoDTO(await this.pontos.criar({ ...dados, criadoPor }));
  }

  async atualizar(id: string, entrada: unknown): Promise<PontoDTO> {
    const atual = await this.obter(id);
    const dados = validar(atualizarPontoSchema, entrada);

    if (dados.instituicaoId) await this.garantirInstituicao(dados.instituicaoId);
    if (dados.ativo === false && atual.ativo) this.garantirForaDeRotasAtivas(atual);

    return paraPontoDTO(await this.pontos.atualizar(id, dados));
  }

  // ---------------------------------------------------------------- Regras

  private async obter(id: string): Promise<Ponto> {
    const ponto = await this.pontos.buscarPorId(id);
    if (!ponto) throw new ErroNaoEncontrado("Ponto não encontrado.");
    return ponto;
  }

  private async garantirInstituicao(id: string) {
    if (!(await this.instituicoes.buscarPorId(id))) {
      throw new ErroDeValidacao("Instituição não encontrada.", {
        instituicaoId: ["Escolha uma instituição da lista."],
      });
    }
  }

  /**
   * Ponto que está no trajeto de uma rota ativa não pode ser desativado: a rota
   * continuaria parando nele, e os planos que embarcam ou descem ali ficariam
   * apontando para um lugar "inexistente". Primeiro tira do trajeto.
   */
  private garantirForaDeRotasAtivas(ponto: Ponto) {
    const ativas = ponto.rotas.filter((r) => r.ativa);
    if (ativas.length > 0) {
      throw new ErroDeValidacao(
        `O ponto está no trajeto de: ${ativas.map((r) => r.nome).join(", ")}. Retire-o do trajeto antes de desativá-lo.`,
        { ativo: ["Ponto em uso por rota ativa."] },
      );
    }
  }
}
