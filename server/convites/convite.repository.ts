import type { Aluno, DadosCriarAluno } from "@/server/alunos/aluno.repository";

export type Convite = {
  id: string;
  email: string | null;
  expiraEm: Date;
  usadoEm: Date | null;
  revogadoEm: Date | null;
  criadoEm: Date;
  /** Quem se cadastrou com ele (preenchido depois do uso). */
  aluno: { id: string; nome: string } | null;
};

export interface IConviteRepository {
  criar(dados: { tokenHash: string; email: string | null; expiraEm: Date; criadoPor: string }): Promise<Convite>;
  listar(): Promise<Convite[]>;
  buscarPorId(id: string): Promise<Convite | null>;
  buscarPorTokenHash(tokenHash: string): Promise<(Convite & { criadoPor: string }) | null>;
  revogar(id: string, em: Date): Promise<void>;
  /**
   * Numa transação: marca o convite como usado — só se ainda estiver pendente
   * (não usado, não revogado, não vencido) — e cria o aluno. Devolve null se o
   * convite já não valia; dois cadastros simultâneos não passam os dois.
   */
  usarECriarAluno(conviteId: string, agora: Date, dados: DadosCriarAluno): Promise<Aluno | null>;
}
