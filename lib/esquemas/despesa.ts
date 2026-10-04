import { z } from "zod";
import { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import { hojeLocal } from "@/lib/datas";
import { dataObrigatoria, dinheiroPositivo, idOpcional, textoObrigatorio } from "./comum";

export const LIMITES_DESPESA = { descricaoMin: 2, descricaoMax: 120 } as const;

const campos = {
  categoria: z.enum(CategoriaDespesa, { error: "Escolha a categoria." }),
  descricao: textoObrigatorio("descrição", LIMITES_DESPESA.descricaoMin, LIMITES_DESPESA.descricaoMax, "a"),
  valor: dinheiroPositivo("valor"),
  // Despesa é registro do que já foi gasto: data futura é erro de digitação.
  data: dataObrigatoria("data").refine((d) => d <= hojeLocal(), "A data não pode ser no futuro."),
  /** Vazio = despesa geral, sem veículo (seguro da frota, salários...). */
  veiculoId: idOpcional(),
};

export const criarDespesaSchema = z.object(campos);
export const atualizarDespesaSchema = z
  .object(campos)
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar.");

/** Mês "AAAA-MM" (do <input type="month">) e categoria, ambos opcionais. */
export const filtroDespesasSchema = z.object({
  mes: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional().catch(undefined),
  categoria: z.enum(CategoriaDespesa).optional().catch(undefined),
});

export type CriarDespesaDTO = z.output<typeof criarDespesaSchema>;
export type AtualizarDespesaDTO = z.output<typeof atualizarDespesaSchema>;
