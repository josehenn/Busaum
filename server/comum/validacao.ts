import { z } from "zod";
import { ErroDeValidacao } from "./erros";

/**
 * Valida a entrada com o schema Zod e devolve o dado já tipado e normalizado.
 * Fica no service — e não só no Route Handler — para que a regra valha para
 * qualquer chamador: API, Server Component ou Server Action.
 */
export function validar<T extends z.ZodType>(schema: T, entrada: unknown): z.output<T> {
  const resultado = schema.safeParse(entrada);
  if (!resultado.success) {
    const { formErrors, fieldErrors } = z.flattenError(resultado.error);
    // formErrors: regras do objeto inteiro (refine), que não pertencem a um campo.
    throw new ErroDeValidacao(
      formErrors[0] ?? "Revise os campos destacados.",
      fieldErrors as Record<string, string[]>,
    );
  }
  return resultado.data;
}
