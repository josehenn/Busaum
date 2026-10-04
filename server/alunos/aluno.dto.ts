// DTOs de saída. A entrada (schemas Zod) mora em lib/esquemas/aluno.ts.
//
// LGPD: CPF e telefone são dados pessoais que a listagem e a API não precisam.
// - AlunoDTO (listagem e API): CPF só mascarado, telefone nunca.
// - AlunoEdicaoDTO (formulário de edição do admin): inclui o telefone, que o
//   admin precisa ver para corrigir. O CPF continua mascarado — ele não é editável.
import type { StatusAluno, Turno } from "@/lib/generated/prisma/enums";
import { mascararCpf } from "@/lib/mascaras";
import type { Aluno } from "./aluno.repository";

export {
  atualizarAlunoSchema,
  criarAlunoSchema,
  filtroAlunosSchema,
  type AtualizarAlunoDTO,
  type CriarAlunoDTO,
  type FiltroAlunos,
} from "@/lib/esquemas/aluno";

export type AlunoDTO = {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  cpfMascarado: string;
  instituicao: { id: string; nome: string; sigla: string | null };
  matricula: string | null;
  curso: string;
  turno: Turno;
  status: StatusAluno;
  /** "AAAA-MM-DD" */
  inicioEm: string;
  criadoEm: string;
  atualizadoEm: string;
};

export type AlunoEdicaoDTO = AlunoDTO & { telefone: string };

export function paraAlunoDTO(aluno: Aluno): AlunoDTO {
  return {
    id: aluno.id,
    usuarioId: aluno.usuarioId,
    nome: aluno.usuario.nome,
    email: aluno.usuario.email,
    cpfMascarado: mascararCpf(aluno.cpf),
    instituicao: aluno.instituicao,
    matricula: aluno.matricula,
    curso: aluno.curso,
    turno: aluno.turno,
    status: aluno.status,
    inicioEm: aluno.inicioEm.toISOString().slice(0, 10),
    criadoEm: aluno.criadoEm.toISOString(),
    atualizadoEm: aluno.atualizadoEm.toISOString(),
  };
}

export function paraAlunoEdicaoDTO(aluno: Aluno): AlunoEdicaoDTO {
  return { ...paraAlunoDTO(aluno), telefone: aluno.telefone };
}
