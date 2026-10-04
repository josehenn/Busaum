import { prisma } from "@/lib/prisma";
import { instituicaoRepository } from "@/server/instituicoes";
import { AlunoService } from "./aluno.service";
import { PrismaAlunoRepository } from "./prisma-aluno.repository";

export const alunoService = new AlunoService(new PrismaAlunoRepository(prisma), instituicaoRepository);

export type { AlunoDTO, AlunoEdicaoDTO } from "./aluno.dto";
