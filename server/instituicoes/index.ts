import { prisma } from "@/lib/prisma";
import { InstituicaoService } from "./instituicao.service";
import { PrismaInstituicaoRepository } from "./prisma-instituicao.repository";

/** Exportado também para os módulos que precisam conferir se uma instituição existe. */
export const instituicaoRepository = new PrismaInstituicaoRepository(prisma);
export const instituicaoService = new InstituicaoService(instituicaoRepository);

export type { InstituicaoDTO } from "./instituicao.service";
