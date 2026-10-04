import type { StatusViagem } from "@/lib/generated/prisma/enums";
import type { DeclaracaoParaEsperados, PlanoParaEsperados } from "./esperados";

/** Viagem = a ocorrência de uma rota num dia (ida e volta). */
export type Viagem = {
  id: string;
  rotaId: string;
  veiculoId: string;
  data: Date;
  horarioIda: Date;
  horarioVolta: Date;
  prazoDeclaracao: Date;
  capacidade: number;
  status: StatusViagem;
  motivoCancelamento: string | null;
  rota: {
    id: string;
    nome: string;
    valorDiaria: { toString(): string };
    pontos: { id: string; ordem: number; descricao: string }[];
  };
  veiculo: { id: string; placa: string; modelo: string };
};

export interface IViagemRepository {
  /**
   * Cria as viagens que faltam das rotas ativas no intervalo [de, ate] —
   * idempotente (@@unique rotaId+data). Marca como REALIZADA as que já voltaram.
   */
  gerar(de: Date, ate: Date, agora: Date): Promise<void>;
  listar(filtro: { de: Date; ate: Date; rotaIds?: string[] }): Promise<Viagem[]>;
  buscarPorId(id: string): Promise<Viagem | null>;
  /** Planos (inclusive encerrados) com vigência que encosta no intervalo. */
  listarPlanos(rotaIds: string[], de: Date, ate: Date): Promise<PlanoParaEsperados[]>;
  listarDeclaracoes(viagemIds: string[]): Promise<DeclaracaoParaEsperados[]>;
  cancelar(id: string, motivo: string): Promise<Viagem>;
  trocarVeiculo(id: string, veiculo: { id: string; capacidade: number }): Promise<Viagem>;
}
