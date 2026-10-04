// Peças de validação reaproveitadas pelos schemas dos módulos. Cada uma dá uma
// única mensagem por erro (abort: true no "obrigatório").
import { z } from "zod";
import { reaisParaCentavos, centavosParaDecimal } from "@/lib/dinheiro";
import { dataDeIso } from "@/lib/datas";

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Texto obrigatório com limites. `artigo` concorda a mensagem: "Informe a matrícula." */
export function textoObrigatorio(rotulo: string, min: number, max: number, artigo = "o") {
  return z
    .string({ error: `Informe ${artigo} ${rotulo}.` })
    .trim()
    .min(1, { error: `Informe ${artigo} ${rotulo}.`, abort: true })
    .min(min, `${capitalizar(artigo)} ${rotulo} precisa ter ao menos ${min} caracteres.`)
    .max(max, `${capitalizar(artigo)} ${rotulo} pode ter no máximo ${max} caracteres.`);
}

/** Texto opcional: vazio vira null. No PATCH, ausente = não mexe; "" = apaga. */
export function textoOpcional(rotulo: string, max: number, artigo = "o") {
  return z
    .string({ error: `${capitalizar(artigo)} ${rotulo} é inválid${artigo}.` })
    .trim()
    .max(max, `${capitalizar(artigo)} ${rotulo} pode ter no máximo ${max} caracteres.`)
    .transform((valor) => (valor === "" ? null : valor))
    .nullish();
}

/** Escolha obrigatória numa lista de registros (id). */
export function idObrigatorio(mensagem: string) {
  return z.string({ error: mensagem }).min(1, mensagem);
}

/** Id opcional: "" ou ausente vira null. */
export function idOpcional() {
  return z
    .string()
    .transform((valor) => (valor === "" ? null : valor))
    .nullish();
}

/**
 * Valor em reais como a máscara deixa ("1.234,56") → string decimal "1234.56".
 * Maior que zero e até R$ 9.999.999,99.
 */
export function dinheiroPositivo(rotulo: string, artigo = "o") {
  return z
    .string({ error: `Informe ${artigo} ${rotulo}.` })
    .transform((texto, ctx) => {
      const centavos = reaisParaCentavos(texto);
      if (centavos === null) {
        ctx.addIssue({ code: "custom", message: `Informe ${artigo} ${rotulo}.` });
        return z.NEVER;
      }
      if (centavos <= 0) {
        ctx.addIssue({ code: "custom", message: `${capitalizar(artigo)} ${rotulo} precisa ser maior que zero.` });
        return z.NEVER;
      }
      return centavosParaDecimal(centavos);
    });
}

/** Ajuste em reais: aceita negativo ("-24,00"). Vazio → null (sem ajuste). */
export const dinheiroComSinal = z
  .string({ error: "Valor inválido." })
  .transform((texto, ctx) => {
    const limpo = texto.trim();
    if (limpo === "") return null;
    const centavos = reaisParaCentavos(limpo);
    if (centavos === null) {
      ctx.addIssue({ code: "custom", message: "Valor inválido." });
      return z.NEVER;
    }
    return centavosParaDecimal(limpo.startsWith("-") ? -centavos : centavos);
  });

/** "hh:mm" do <input type="time">. */
export function horario(rotulo: string) {
  return z
    .string({ error: `Informe ${rotulo}.` })
    .min(1, { error: `Informe ${rotulo}.`, abort: true })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Horário inválido.");
}

/** "AAAA-MM-DD" do <input type="date"> → data @db.Date. */
export function dataObrigatoria(rotulo: string, artigo = "a") {
  return z
    .string({ error: `Informe ${artigo} ${rotulo}.` })
    .min(1, { error: `Informe ${artigo} ${rotulo}.`, abort: true })
    .pipe(z.iso.date("Data inválida."))
    .transform(dataDeIso);
}

/** Dias da semana ISO (1 = segunda), sem repetição, ao menos um. */
export function diasDaSemana(mensagemVazio: string) {
  return z
    .array(z.number().int().min(1).max(7), { error: mensagemVazio })
    .min(1, mensagemVazio)
    .transform((dias) => [...new Set(dias)].sort((a, b) => a - b));
}
