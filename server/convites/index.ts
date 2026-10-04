import { alunoService } from "@/server/alunos";
import { repositorios } from "@/server/repositorios";
import { ConviteService } from "./convite.service";

export const conviteService = new ConviteService(repositorios.convites, alunoService);

export type { ConviteDTO, SituacaoConvite } from "./convite.service";
