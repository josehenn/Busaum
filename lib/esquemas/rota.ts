// Regras de entrada da rota e do plano (contratação do aluno numa rota).
import { z } from "zod";
import {
  diasDaSemana,
  dinheiroPositivo,
  horario,
  idObrigatorio,
  idOpcional,
  textoObrigatorio,
} from "./comum";

export const LIMITES_ROTA = {
  nomeMin: 3,
  nomeMax: 80,
  antecedenciaMax: 24 * 60,
} as const;

const antecedenciaMinutos = z
  .number({
    error: (issue) =>
      issue.input === undefined ? "Informe a antecedência." : "A antecedência precisa ser um número.",
  })
  .int("Use minutos inteiros.")
  .min(0, "A antecedência não pode ser negativa.")
  .max(LIMITES_ROTA.antecedenciaMax, "A antecedência máxima é de 24 horas (1440 minutos).");

/** Ids dos pontos na ordem da ida. A volta percorre a mesma lista ao contrário. */
const pontos = z
  .array(z.string().min(1), { error: "Monte o trajeto." })
  .min(2, "O trajeto precisa de ao menos 2 pontos.")
  .refine((ids) => new Set(ids).size === ids.length, "Um ponto não pode aparecer duas vezes no trajeto.");

const campos = {
  nome: textoObrigatorio("nome", LIMITES_ROTA.nomeMin, LIMITES_ROTA.nomeMax),
  veiculoId: idObrigatorio("Escolha o veículo."),
  horarioIda: horario("o horário de ida"),
  horarioVolta: horario("o horário de volta"),
  diasOperacao: diasDaSemana("Escolha ao menos um dia de operação."),
  antecedenciaMinutos,
  valorDiaria: dinheiroPositivo("valor da diária"),
  pontos,
};

/** "hh:mm" compara como texto. Só checa quando os dois horários vieram. */
function voltaDepoisDaIda(dados: { horarioIda?: string; horarioVolta?: string }, ctx: z.RefinementCtx) {
  if (dados.horarioIda && dados.horarioVolta && dados.horarioVolta <= dados.horarioIda) {
    ctx.addIssue({
      code: "custom",
      path: ["horarioVolta"],
      message: "A volta precisa ser depois da ida.",
    });
  }
}

export const criarRotaSchema = z.object(campos).superRefine(voltaDepoisDaIda);

export const atualizarRotaSchema = z
  .object({ ...campos, ativa: z.boolean({ error: "Status inválido." }) })
  .partial()
  .superRefine(voltaDepoisDaIda)
  .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar.");

export type CriarRotaDTO = z.output<typeof criarRotaSchema>;
export type AtualizarRotaDTO = z.output<typeof atualizarRotaSchema>;

// ---------------------------------------------------------------- Plano

/**
 * Contratar (ou trocar) o plano de um aluno numa rota. Se o aluno já tem plano
 * aberto nesta rota, é uma troca: o atual é encerrado e o novo começa agora.
 */
export const contratarPlanoSchema = z.object({
  alunoId: idObrigatorio("Escolha o aluno."),
  rotaId: idObrigatorio("Escolha a rota."),
  pontoEmbarqueId: idObrigatorio("Escolha onde o aluno sobe."),
  pontoDestinoId: idObrigatorio("Escolha onde o aluno desce."),
  /** Vazio = volta para o ponto de embarque. */
  pontoRetornoId: idOpcional(),
  diasSemana: diasDaSemana("Escolha ao menos um dia."),
});

export type ContratarPlanoDTO = z.output<typeof contratarPlanoSchema>;
