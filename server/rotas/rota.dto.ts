import type { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";
import { horarioLocal } from "@/lib/datas";
import type { PontoDoTrajeto, Rota } from "./rota.repository";

export { atualizarRotaSchema, criarRotaSchema } from "@/lib/esquemas/rota";

export type RotaDTO = {
  id: string;
  nome: string;
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
    tipo: TipoVeiculo;
    capacidade: number;
    status: StatusVeiculo;
  };
  /** "hh:mm" no horário de Brasília. */
  horarioIda: string;
  horarioVolta: string;
  diasOperacao: number[];
  antecedenciaMinutos: number;
  /** Decimal em string: "18.00". */
  valorDiaria: string;
  ativa: boolean;
  pontos: PontoDoTrajeto[];
  planosAbertos: number;
};

export function paraRotaDTO(rota: Rota): RotaDTO {
  return {
    id: rota.id,
    nome: rota.nome,
    veiculo: rota.veiculo,
    horarioIda: horarioLocal(rota.horarioIda),
    horarioVolta: horarioLocal(rota.horarioVolta),
    diasOperacao: rota.diasOperacao,
    antecedenciaMinutos: rota.antecedenciaMinutos,
    valorDiaria: Number(rota.valorDiaria.toString()).toFixed(2),
    ativa: rota.ativa,
    pontos: rota.pontos,
    planosAbertos: rota.planosAbertos,
  };
}
