// Por enquanto sem tela própria: as instituições vêm do seed ou nascem no
// cadastro do aluno, digitadas como texto livre.

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
}
