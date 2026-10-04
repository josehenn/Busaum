import type { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import type { AtualizarDespesaDTO, CriarDespesaDTO } from "@/lib/esquemas/despesa";

export type Despesa = {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: { toString(): string };
  data: Date;
  comprovanteUrl: string | null;
  veiculo: { id: string; placa: string; modelo: string } | null;
};

export interface IDespesaRepository {
  /** Despesas com data em [de, ate). */
  listar(filtro: { de?: Date; ate?: Date; categoria?: CategoriaDespesa }): Promise<Despesa[]>;
  buscarPorId(id: string): Promise<Despesa | null>;
  criar(dados: CriarDespesaDTO & { comprovanteUrl: string | null; criadoPor: string }): Promise<Despesa>;
  atualizar(id: string, dados: AtualizarDespesaDTO & { comprovanteUrl?: string }): Promise<Despesa>;
}
