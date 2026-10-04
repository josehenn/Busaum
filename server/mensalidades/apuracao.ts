// Apuração da competência (docs/modelagem.md, "Fechamento"). Função pura: recebe
// as viagens do mês, os planos e as declarações, e devolve as diárias de cada
// aluno. A cobrança sai do PLANO, não da presença: dia contratado é cobrado vá
// o aluno ou não — só justificativa aprovada ou viagem cancelada isentam.
import { SituacaoDiaria, StatusJustificativa, StatusViagem } from "@/lib/generated/prisma/enums";
import { decimalParaCentavos } from "@/lib/dinheiro";
import type { PlanoParaEsperados } from "@/server/viagens/esperados";
import { diaContratado, planoVigenteNaViagem } from "@/server/viagens/esperados";
import type { DeclaracaoParaApuracao, ViagemParaApuracao } from "./mensalidade.repository";

export type DiariaApurada = {
  viagemId: string;
  planoRotaId: string | null;
  data: Date;
  centavos: number;
  situacao: SituacaoDiaria;
  justificativaId: string | null;
};

export function apurar(
  viagens: ViagemParaApuracao[],
  planos: PlanoParaEsperados[],
  declaracoes: DeclaracaoParaApuracao[],
): Map<string, DiariaApurada[]> {
  const porAluno = new Map<string, DiariaApurada[]>();
  const alunos = [...new Set(planos.map((p) => p.alunoId))];

  for (const viagem of [...viagens].sort((a, b) => a.data.getTime() - b.data.getTime())) {
    for (const alunoId of alunos) {
      // Qual plano valia neste dia: o vigente no prazo de declaração da viagem.
      const plano = planoVigenteNaViagem(planos, viagem, alunoId);
      if (!plano) continue;

      const contratado = diaContratado(plano, viagem);
      const declaracao = declaracoes.find(
        (d) => d.viagemId === viagem.id && d.alunoId === alunoId && d.canceladoEm === null,
      );
      const avulso = !contratado && declaracao !== undefined && (declaracao.usaIda || declaracao.usaVolta);
      if (!contratado && !avulso) continue;

      const aprovada =
        declaracao?.justificativa?.status === StatusJustificativa.APROVADA ? declaracao.justificativa : null;
      const situacao =
        viagem.status === StatusViagem.CANCELADA
          ? SituacaoDiaria.ISENTA_VIAGEM_CANCELADA
          : aprovada
            ? SituacaoDiaria.ISENTA_JUSTIFICADA
            : SituacaoDiaria.COBRADA;

      const lista = porAluno.get(alunoId) ?? [];
      lista.push({
        viagemId: viagem.id,
        planoRotaId: contratado ? plano.id : null, // nulo = diária avulsa
        data: viagem.data,
        // Cópia do valor da rota: reajuste futuro não muda mês fechado.
        centavos: decimalParaCentavos(viagem.valorDiaria.toString()),
        situacao,
        justificativaId: situacao === SituacaoDiaria.ISENTA_JUSTIFICADA ? aprovada!.id : null,
      });
      porAluno.set(alunoId, lista);
    }
  }
  return porAluno;
}
