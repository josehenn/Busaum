// Contrato de acesso a dados do módulo (padrão Repository). O service depende
// desta interface, não do Prisma: dá para trocar o banco — ou usar um repositório
// em memória num teste — sem mexer em regra de negócio.
import type { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";
import type { AtualizarVeiculoDTO, CriarVeiculoDTO } from "./veiculo.dto";

export type Veiculo = {
  id: string;
  placa: string;
  tipo: TipoVeiculo;
  modelo: string;
  capacidade: number;
  status: StatusVeiculo;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
};

export interface IVeiculoRepository {
  listar(): Promise<Veiculo[]>;
  buscarPorId(id: string): Promise<Veiculo | null>;
  buscarPorPlaca(placa: string): Promise<Veiculo | null>;
  criar(dados: CriarVeiculoDTO & { criadoPor: string }): Promise<Veiculo>;
  atualizar(id: string, dados: AtualizarVeiculoDTO): Promise<Veiculo>;
  /** Rotas ativas que têm este veículo como padrão. */
  listarRotasAtivasDoVeiculo(id: string): Promise<{ id: string; nome: string }[]>;
}
