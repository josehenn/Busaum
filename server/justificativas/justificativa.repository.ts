import type { MotivoJustificativa, StatusJustificativa, StatusViagem } from "@/lib/generated/prisma/enums";
import type { FiltroJustificativas } from "@/lib/esquemas/justificativa";
import type { PlanoParaEsperados } from "@/server/viagens/esperados";

export type Justificativa = {
  id: string;
  motivo: MotivoJustificativa;
  descricao: string;
  anexoUrl: string;
  status: StatusJustificativa;
  observacaoDecisao: string | null;
  decididoPor: string | null;
  decididoEm: Date | null;
  criadoEm: Date;
  aluno: { id: string; nome: string };
  viagem: { id: string; data: Date; rotaNome: string };
};

/** Uma viagem passada de rota em que o aluno teve plano, com o que ele declarou. */
export type ViagemDoHistorico = {
  id: string;
  rotaId: string;
  rotaNome: string;
  data: Date;
  prazoDeclaracao: Date;
  horarioVolta: Date;
  status: StatusViagem;
  declaracao: { usaIda: boolean; usaVolta: boolean; canceladoEm: Date | null; temJustificativa: boolean } | null;
};

export interface IJustificativaRepository {
  listar(filtro: FiltroJustificativas & { alunoId?: string }): Promise<Justificativa[]>;
  buscarPorId(id: string): Promise<Justificativa | null>;
  /** Viagens do aluno no período (rotas onde ele teve plano) + os planos, para saber quais eram contratadas. */
  historicoDoAluno(alunoId: string, de: Date, ate: Date): Promise<{
    viagens: ViagemDoHistorico[];
    planos: PlanoParaEsperados[];
  }>;
  /**
   * Cria a justificativa. Se o aluno não tinha avisado a ausência, a declaração
   * de ausência é criada junto — na mesma transação.
   */
  criar(dados: {
    viagemId: string;
    alunoId: string;
    motivo: MotivoJustificativa;
    descricao: string;
    anexoUrl: string;
    em: Date;
  }): Promise<string>;
  decidir(
    id: string,
    dados: { status: StatusJustificativa; observacao: string | null; por: string; em: Date },
  ): Promise<void>;
  /** O anexo pertence a uma justificativa deste aluno? (controle de acesso ao arquivo) */
  anexoEhDoAluno(anexoUrl: string, alunoId: string): Promise<boolean>;
}
