import { z } from "zod";

export type ErrosPorCampo = Record<string, string[]>;

/** Roda o schema e devolve as mensagens por campo ({} quando está tudo certo). */
export function errosDoSchema(schema: z.ZodType, dados: unknown): ErrosPorCampo {
  const resultado = schema.safeParse(dados);
  if (resultado.success) return {};
  return z.flattenError(resultado.error).fieldErrors as ErrosPorCampo;
}
