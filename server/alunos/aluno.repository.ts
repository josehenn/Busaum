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

/** Instituição já cadastrada (id) ou nova, a ser criada junto com o aluno (nome). */
export type ReferenciaInstituicao = { id: string } | { nome: string };

/** Dados como o repositório recebe: a instituição já resolvida pelo service. */
export type DadosCriarAluno = Omit<CriarAlunoDTO, "instituicao"> & {
  instituicao: ReferenciaInstituicao;
  criadoPor: string;
};
export type DadosAtualizarAluno = Omit<AtualizarAlunoDTO, "instituicao"> & {
  instituicao?: ReferenciaInstituicao;
};

export interface IAlunoRepository {
  listar(filtro: FiltroAlunos): Promise<Aluno[]>;
  buscarPorId(id: string): Promise<Aluno | null>;
  /** Para as checagens de unicidade: devolvem o id de quem já usa o valor. */
  idDoUsuarioComEmail(email: string): Promise<string | null>;
  idDoAlunoComCpf(cpf: string): Promise<string | null>;
  idDoAlunoComMatricula(instituicaoId: string, matricula: string): Promise<string | null>;
  /**
   * Cria, numa única transação, o usuário de login (perfil ALUNO), o aluno e —
   * se a referência for por nome — a instituição nova.
   */
  criar(dados: DadosCriarAluno): Promise<Aluno>;
  /**
   * Atualiza aluno e usuário. Com `encerrarPlanosEm`, fecha na mesma transação os
   * planos de transporte ainda abertos (vigenteAte = esse instante).
   */
  atualizar(id: string, dados: DadosAtualizarAluno, opcoes?: { encerrarPlanosEm?: Date }): Promise<Aluno>;
}
