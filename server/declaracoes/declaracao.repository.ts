import type { OrigemDeclaracao } from "@/lib/generated/prisma/enums";

export type Declaracao = {
  id: string;
  viagemId: string;
  alunoId: string;
  usaIda: boolean;
  usaVolta: boolean;
  origem: OrigemDeclaracao;
  declaradoEm: Date;
  canceladoEm: Date | null;
  temJustificativa: boolean;
};

export interface IDeclaracaoRepository {
  buscar(viagemId: string, alunoId: string): Promise<Declaracao | null>;
  /**
   * Grava a declaração do aluno para a viagem. Existe uma por aluno por viagem
   * (@@unique): declarar de novo depois de desfazer reaproveita a linha.
   */
  salvar(dados: {
    viagemId: string;
    alunoId: string;
    usaIda: boolean;
    usaVolta: boolean;
    origem: OrigemDeclaracao;
    em: Date;
  }): Promise<Declaracao>;
  /** Desfaz sem apagar: marca canceladoEm (o histórico do aviso fica). */
  desfazer(id: string, em: Date): Promise<void>;
}
