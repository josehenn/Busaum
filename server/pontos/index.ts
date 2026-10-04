import { repositorios } from "@/server/repositorios";
import { PontoService } from "./ponto.service";

export const pontoService = new PontoService(repositorios.pontos, repositorios.instituicoes);

export type { PontoDTO } from "./ponto.dto";
