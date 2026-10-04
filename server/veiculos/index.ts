// Ponto de montagem do módulo (composition root): liga o service à implementação
// concreta do repositório. Páginas e Route Handlers importam daqui e nunca
// instanciam nada por conta própria.
import { prisma } from "@/lib/prisma";
import { PrismaVeiculoRepository } from "./prisma-veiculo.repository";
import { VeiculoService } from "./veiculo.service";

export const veiculoService = new VeiculoService(new PrismaVeiculoRepository(prisma));

export type { VeiculoDTO } from "./veiculo.dto";
