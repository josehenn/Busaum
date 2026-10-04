/** Para comparar textos digitados: sem acento, sem maiúsculas, sem espaços nas pontas. */
export function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
