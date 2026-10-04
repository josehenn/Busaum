import { prisma } from "@/lib/prisma";
import { hojeLocal } from "@/lib/datas";
import {
  StatusAluno,
  StatusJustificativa,
  StatusMensalidade,
  StatusVeiculo,
  StatusViagem,
} from "@/lib/generated/prisma/enums";

export type ResumoAdmin = {
  veiculosAtivos: number;
  alunosAtivos: number;
  viagensHoje: number;
  justificativasPendentes: number;
  mensalidadesEmAberto: number;
};

/** Números do painel inicial do admin. */
export async function obterResumoAdmin(): Promise<ResumoAdmin> {
  const [veiculosAtivos, alunosAtivos, viagensHoje, justificativasPendentes, mensalidadesEmAberto] =
    await Promise.all([
      prisma.veiculo.count({ where: { status: StatusVeiculo.ATIVO } }),
      prisma.aluno.count({ where: { status: StatusAluno.ATIVO } }),
      prisma.viagem.count({ where: { data: hojeLocal(), status: { not: StatusViagem.CANCELADA } } }),
      prisma.justificativa.count({ where: { status: StatusJustificativa.PENDENTE } }),
      prisma.mensalidade.count({
        where: { status: { in: [StatusMensalidade.ABERTA, StatusMensalidade.VENCIDA] } },
      }),
    ]);

  return { veiculosAtivos, alunosAtivos, viagensHoje, justificativasPendentes, mensalidadesEmAberto };
}
