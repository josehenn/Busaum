import { repositorios } from "@/server/repositorios";
import { PlanoService } from "./plano.service";

export const planoService = new PlanoService(repositorios.planos, repositorios.rotas, repositorios.alunos);

export type { PlanoDTO } from "./plano.service";
