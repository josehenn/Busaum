import type { SituacaoDiaria, StatusMensalidade, StatusViagem } from "@/lib/generated/prisma/enums";
import type { DeclaracaoParaEsperados, PlanoParaEsperados } from "@/server/viagens/esperados";

type Decimalish = { toString(): string };

export type Diaria = {
  id: string;
  viagemId: string;
  data: Date;
  valorDiaria: Decimalish;
  situacao: SituacaoDiaria;
  avulsa: boolean;
  rotaNome: string;
};

export type Mensalidade = {
  id: string;
  alunoId: string;
  alunoNome: string;
  competencia: string;
  diariasCobradas: number;
  diariasIsentas: number;
  subtotal: Decimalish;
  ajuste: Decimalish | null;
  motivoAjuste: string | null;
  ajustadoPor: string | null;
  ajustadoEm: Date | null;
  valor: Decimalish;
  vencimentoEm: Date;
  status: StatusMensalidade;
  pagoEm: Date | null;
  referenciaGateway: string | null;
  baixaPor: string | null;
  baixaEm: Date | null;
};

export type MensalidadeComDiarias = Mensalidade & { diarias: Diaria[] };

export type ViagemParaApuracao = {
  id: string;
  rotaId: string;
  data: Date;
  prazoDeclaracao: Date;
  status: StatusViagem;
  valorDiaria: Decimalish;
};

export type DeclaracaoParaApuracao = DeclaracaoParaEsperados & {
  justificativa: { id: string; status: string } | null;
};

export type NovaMensalidade = {
  alunoId: string;
  competencia: string;
  diariasCobradas: number;
  diariasIsentas: number;
  subtotal: string;
  valor: string;
  vencimentoEm: Date;
  referenciaGateway: string;
  diarias: {
    viagemId: string;
    planoRotaId: string | null;
    data: Date;
    valorDiaria: string;
    situacao: SituacaoDiaria;
    justificativaId: string | null;
  }[];
};

export type ResultadoIsencao = "SEM_COBRANCA" | "ISENTADA" | "MENSALIDADE_PAGA";

export interface IMensalidadeRepository {
  listar(filtro: { competencia?: string; status?: StatusMensalidade; alunoId?: string }): Promise<Mensalidade[]>;
  buscarPorId(id: string): Promise<MensalidadeComDiarias | null>;
  /** Competências já fechadas, da mais recente para a mais antiga. */
  competencias(): Promise<string[]>;
  existeCompetencia(competencia: string): Promise<boolean>;
  dadosParaApuracao(de: Date, ate: Date): Promise<{
    viagens: ViagemParaApuracao[];
    planos: PlanoParaEsperados[];
    declaracoes: DeclaracaoParaApuracao[];
  }>;
  criarEmLote(mensalidades: NovaMensalidade[]): Promise<void>;
  ajustar(id: string, dados: { ajuste: string | null; motivo: string | null; por: string; valor: string }): Promise<void>;
  darBaixa(id: string, dados: { pagoEm: Date; referencia: string; por: string }): Promise<void>;
  /** ABERTA com vencimento passado vira VENCIDA. */
  marcarVencidas(agora: Date): Promise<void>;
  /**
   * Justificativa aprovada depois do fechamento: se a diária daquele dia está
   * numa mensalidade ainda não paga, vira ISENTA_JUSTIFICADA e os totais são
   * recalculados. Se já foi paga, não mexe — o admin lança um ajuste.
   */
  isentarDiaria(viagemId: string, alunoId: string, justificativaId: string): Promise<ResultadoIsencao>;
  nomesDeUsuarios(ids: string[]): Promise<Map<string, string>>;
}
