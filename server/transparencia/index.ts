import { repositorios } from "@/server/repositorios";
import { TransparenciaService } from "./transparencia.service";

export const transparenciaService = new TransparenciaService(repositorios.despesas);
