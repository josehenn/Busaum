import { repositorios } from "@/server/repositorios";
import { ViagemService } from "./viagem.service";

export const viagemService = new ViagemService(repositorios.viagens, repositorios.veiculos);

export type { ViagemResumoDTO } from "./viagem.service";
