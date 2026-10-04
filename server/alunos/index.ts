import { repositorios } from "@/server/repositorios";
import { AlunoService } from "./aluno.service";

export const alunoService = new AlunoService(repositorios.alunos, repositorios.instituicoes);

export type { AlunoDTO, AlunoEdicaoDTO } from "./aluno.dto";
