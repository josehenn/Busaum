import type { AtualizarPontoDTO, CriarPontoDTO, FiltroPontos } from "@/lib/esquemas/ponto";

export type Ponto = {
  id: string;
  descricao: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  referencia: string | null;
  instituicaoId: string | null;
  latitude: { toString(): string } | null;
  longitude: { toString(): string } | null;
  ativo: boolean;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
  instituicao: { id: string; nome: string; sigla: string | null } | null;
  /** Rotas cujo trajeto passa por este ponto. */
  rotas: { id: string; nome: string; ativa: boolean }[];
};

export interface IPontoRepository {
  listar(filtro: FiltroPontos): Promise<Ponto[]>;
  /** Pontos ativos, para montar trajetos. */
  listarAtivos(): Promise<Ponto[]>;
  buscarPorId(id: string): Promise<Ponto | null>;
  criar(dados: CriarPontoDTO & { criadoPor: string }): Promise<Ponto>;
  atualizar(id: string, dados: AtualizarPontoDTO): Promise<Ponto>;
}
