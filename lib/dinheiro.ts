// Dinheiro trafega como string decimal ("1234.56", o formato do Decimal do
// Prisma) e é somado em centavos inteiros. Nunca Float.
import { apenasDigitos } from "./mascaras";

const formatador = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatadorNumero = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "1234.56" | 1234.56 → "R$ 1.234,56" */
export function formatarReais(valor: string | number) {
  return formatador.format(Number(valor));
}

/** "1234.56" → 123456 */
export function decimalParaCentavos(valor: string | number) {
  return Math.round(Number(valor) * 100);
}

/** 123456 → "1234.56" */
export function centavosParaDecimal(centavos: number) {
  return (centavos / 100).toFixed(2);
}

/**
 * Máscara de digitação: os dígitos entram pela direita, como numa maquininha.
 * "1" → "0,01", "1234" → "12,34", "123456" → "1.234,56". Até R$ 9.999.999,99.
 */
export function mascararReais(digitado: string) {
  const digitos = apenasDigitos(digitado).replace(/^0+/, "").slice(0, 9);
  if (!digitos) return "";
  return formatadorNumero.format(Number(digitos) / 100);
}

/** "1.234,56" (como a máscara deixa) → 123456. Vazio → null. */
export function reaisParaCentavos(texto: string): number | null {
  const digitos = apenasDigitos(texto);
  return digitos ? Number(digitos) : null;
}

/** "1234.56" → "1.234,56", para preencher um campo com máscara. */
export function decimalParaMascara(valor: string | number) {
  return formatadorNumero.format(Number(valor));
}
