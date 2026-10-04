import { repositorios } from "@/server/repositorios";
import { RotaService } from "./rota.service";

export const rotaService = new RotaService(
  repositorios.rotas,
  repositorios.veiculos,
  repositorios.pontos,
  repositorios.planos,
);

export type { RotaDTO } from "./rota.dto";
