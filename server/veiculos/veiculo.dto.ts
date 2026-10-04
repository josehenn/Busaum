// DTOs do módulo. A entrada (schemas Zod) mora em lib/esquemas/veiculo.ts para
// ser compartilhada com o formulário; a saída (VeiculoDTO) é só do servidor.
import type { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";
import type { Veiculo } from "./veiculo.repository";

export {
  atualizarVeiculoSchema,
  criarVeiculoSchema,
  type AtualizarVeiculoDTO,
  type CriarVeiculoDTO,
} from "@/lib/esquemas/veiculo";

/** Resposta da API e dado das telas. Datas viram string ISO para atravessar o JSON. */
export type VeiculoDTO = {
  id: string;
  placa: string;
  tipo: TipoVeiculo;
  modelo: string;
  capacidade: number;
  status: StatusVeiculo;
  criadoEm: string;
  atualizadoEm: string;
};

export function paraVeiculoDTO(veiculo: Veiculo): VeiculoDTO {
  return {
    id: veiculo.id,
    placa: veiculo.placa,
    tipo: veiculo.tipo,
    modelo: veiculo.modelo,
    capacidade: veiculo.capacidade,
    status: veiculo.status,
    criadoEm: veiculo.criadoEm.toISOString(),
    atualizadoEm: veiculo.atualizadoEm.toISOString(),
  };
}
