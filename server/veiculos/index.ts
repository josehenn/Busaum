// Ponto de montagem do módulo: liga o service às implementações concretas.
// Páginas e Route Handlers importam daqui e nunca instanciam nada.
import { repositorios } from "@/server/repositorios";
import { VeiculoService } from "./veiculo.service";

export const veiculoService = new VeiculoService(repositorios.veiculos);

export type { VeiculoDTO } from "./veiculo.dto";
