import type { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";
import type { AtualizarRotaDTO, CriarRotaDTO } from "@/lib/esquemas/rota";

export type PontoDoTrajeto = {
  ordem: number;
  id: string;
  descricao: string;
  instituicaoId: string | null;
  ativo: boolean;
};

export type Rota = {
  id: string;
  nome: string;
  veiculoId: string;
  /** Colunas @db.Time: só a hora (UTC) importa. */
  horarioIda: Date;
  horarioVolta: Date;
  diasOperacao: number[];
  antecedenciaMinutos: number;
  valorDiaria: { toString(): string };
  ativa: boolean;
  criadoEm: Date;
  atualizadoEm: Date;
  veiculo: {
    id: string;
    placa: string;
    modelo: string;
    tipo: TipoVeiculo;
    capacidade: number;
    status: StatusVeiculo;
  };
  /** Na ordem da ida. */
  pontos: PontoDoTrajeto[];
  planosAbertos: number;
};

export interface IRotaRepository {
  listar(): Promise<Rota[]>;
  buscarPorId(id: string): Promise<Rota | null>;
  criar(dados: CriarRotaDTO & { criadoPor: string }): Promise<Rota>;
  /**
   * `replanejarViagens`: apaga as viagens futuras ainda sem nenhum registro
   * (declaração ou diária), para serem geradas de novo com horário, dias e
   * veículo atualizados. As que já têm registro ficam como estão.
   */
  atualizar(id: string, dados: AtualizarRotaDTO, opcoes: { replanejarViagens: boolean }): Promise<Rota>;
}
