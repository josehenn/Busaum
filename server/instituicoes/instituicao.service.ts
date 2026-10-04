import { criarInstituicaoSchema } from "@/lib/esquemas/instituicao";
import { ErroDeConflito } from "@/server/comum/erros";
import { validar } from "@/server/comum/validacao";
import type { IInstituicaoRepository, Instituicao } from "./instituicao.repository";

export type InstituicaoDTO = Instituicao;

export class InstituicaoService {
  constructor(private readonly repositorio: IInstituicaoRepository) {}

  listar(): Promise<InstituicaoDTO[]> {
    return this.repositorio.listar();
  }

  /**
   * Cadastro pelo modal. Não deixa duplicar: se o nome digitado bate com o nome
   * ou a sigla de uma existente (sem diferenciar maiúsculas), recusa e diz qual
   * é — "urs" e "Universidade Regional do Sul" são a mesma.
   */
  async criar(entrada: unknown): Promise<InstituicaoDTO> {
    const { nome } = validar(criarInstituicaoSchema, entrada);
    const existente = await this.repositorio.buscarPorNomeOuSigla(nome);
    if (existente) {
      const descricao = existente.sigla ? `${existente.sigla} — ${existente.nome}` : existente.nome;
      throw new ErroDeConflito(`Já cadastrada: ${descricao}. Escolha-a na lista.`, {
        nome: [`Já cadastrada como "${descricao}".`],
      });
    }
    return this.repositorio.criar({ nome });
  }
}
