import { storageService } from "@/server/arquivos";
import { repositorios } from "@/server/repositorios";
import { JustificativaService } from "./justificativa.service";

export const justificativaService = new JustificativaService(
  repositorios.justificativas,
  repositorios.mensalidades,
  storageService,
);

export type { FaltaJustificavelDTO, JustificativaDTO } from "./justificativa.service";
