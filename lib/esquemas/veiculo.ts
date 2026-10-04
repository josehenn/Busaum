// Regras de entrada do veículo, compartilhadas entre o servidor (service) e a
// tela (formulário). Mudou aqui, mudou nos dois lados.
import { z } from "zod";
import { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";

/** Limites usados pelo schema e pelos atributos dos inputs (maxLength etc.). */
export const LIMITES_VEICULO = {
  placa: 7,
  modeloMin: 2,
  modeloMax: 80,
  capacidadeMax: 100,
} as const;

/** Aceita "abc-1d23" ou "ABC 1234" e guarda sempre "ABC1D23" / "ABC1234". */
export function normalizarPlaca(valor: string) {
  return valor.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

const placa = z
  .string({ error: "Informe a placa." })
  .transform(normalizarPlaca)
  .pipe(
    z
      .string()
      .min(1, { error: "Informe a placa.", abort: true })
      .regex(/^[A-Z]{3}\d[A-Z\d]\d{2}$/, "Placa inválida. Use o formato ABC1234 ou ABC1D23."),
  );

const capacidade = z
  .number({
    error: (issue) =>
      issue.input === undefined ? "Informe a capacidade." : "A capacidade precisa ser um número.",
  })
  .int("A capacidade precisa ser um número inteiro.")
  .positive("A capacidade precisa ser maior que zero.")
  .max(
    LIMITES_VEICULO.capacidadeMax,
    `A capacidade máxima é de ${LIMITES_VEICULO.capacidadeMax} lugares.`,
  );

const modelo = z
  .string({ error: "Informe o modelo." })
  .trim()
  .min(1, { error: "Informe o modelo.", abort: true })
  .min(LIMITES_VEICULO.modeloMin, `O modelo precisa ter ao menos ${LIMITES_VEICULO.modeloMin} caracteres.`)
  .max(LIMITES_VEICULO.modeloMax, `O modelo pode ter no máximo ${LIMITES_VEICULO.modeloMax} caracteres.`);

const tipo = z.enum(TipoVeiculo, { error: "Escolha o tipo do veículo." });
const status = z.enum(StatusVeiculo, { error: "Escolha um status válido." });

export const criarVeiculoSchema = z.object({ placa, tipo, modelo, capacidade });

export const atualizarVeiculoSchema = z
  .object({ placa, tipo, modelo, capacidade, status })
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar.");

export type CriarVeiculoDTO = z.output<typeof criarVeiculoSchema>;
export type AtualizarVeiculoDTO = z.output<typeof atualizarVeiculoSchema>;
