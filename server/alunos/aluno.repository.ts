import type { StatusAluno, Turno } from "@/lib/generated/prisma/enums";
import type { AtualizarAlunoDTO, CriarAlunoDTO, FiltroAlunos } from "@/lib/esquemas/aluno";

/** Aluno com o usuário de login e a instituição — é como toda tela o consome. */
export type Aluno = {
  id: string;
  usuarioId: string;
  instituicaoId: string;
  cpf: string;
  telefone: string;
  matricula: string | null;
  curso: string;
  turno: Turno;
  status: StatusAluno;
  inicioEm: Date;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
  usuario: { id: string; nome: string; email: string };
  instituicao: { id: string; nome: string; sigla: string | null };
};

export type DadosCriarAluno = CriarAlunoDTO & { criadoPor: string };
export type DadosAtualizarAluno = AtualizarAlunoDTO;

export interface IAlunoRepository {
  listar(filtro: FiltroAlunos): Promise<Aluno[]>;
  buscarPorId(id: string): Promise<Aluno | null>;
  /** Para as checagens de unicidade: devolvem o id de quem já usa o valor. */
  idDoUsuarioComEmail(email: string): Promise<string | null>;
  idDoAlunoComCpf(cpf: string): Promise<string | null>;
  idDoAlunoComMatricula(instituicaoId: string, matricula: string): Promise<string | null>;
  /** Cria, numa única transação, o usuário de login (perfil ALUNO) e o aluno. */
  criar(dados: DadosCriarAluno): Promise<Aluno>;
  /**
   * Atualiza aluno e usuário. Com `encerrarPlanosEm`, fecha na mesma transação os
   * planos de transporte ainda abertos (vigenteAte = esse instante).
   */
  atualizar(id: string, dados: DadosAtualizarAluno, opcoes?: { encerrarPlanosEm?: Date }): Promise<Aluno>;
}
