import { repositorios } from "@/server/repositorios";
import { AdministradorService } from "./administrador.service";

export const administradorService = new AdministradorService(repositorios.administradores);

export type { AdministradorDTO } from "./administrador.service";
