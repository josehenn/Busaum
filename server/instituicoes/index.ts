import { repositorios } from "@/server/repositorios";
import { InstituicaoService } from "./instituicao.service";

export const instituicaoService = new InstituicaoService(repositorios.instituicoes);

export type { InstituicaoDTO } from "./instituicao.service";
