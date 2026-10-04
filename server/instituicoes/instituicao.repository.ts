// Instituições não têm tela própria: são cadastradas pelo modal dos formulários
// de aluno e de ponto (só o nome; sigla e cidade são opcionais).

export type Instituicao = {
  id: string;
  nome: string;
  sigla: string | null;
  cidade: string | null;
};

export interface IInstituicaoRepository {
  listar(): Promise<Instituicao[]>;
  buscarPorId(id: string): Promise<Instituicao | null>;
  /** Nome ou sigla iguais ao texto, sem diferenciar maiúsculas. */
  buscarPorNomeOuSigla(texto: string): Promise<Instituicao | null>;
  criar(dados: { nome: string }): Promise<Instituicao>;
}
