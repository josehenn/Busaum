// O banco guarda instantes em UTC; a operação acontece no horário de Brasília
// (UTC-3, sem horário de verão desde 2019). Toda conversão entre os dois passa
// por aqui, para nenhuma tela ou service fazer essa conta por conta própria.

export const FUSO_HORAS = 3;
export const UM_DIA_MS = 24 * 60 * 60 * 1000;

/** Meia-noite UTC do dia — formato usado nas colunas @db.Date. `mes` vai de 1 a 12. */
export function dia(ano: number, mes: number, d: number) {
  return new Date(Date.UTC(ano, mes - 1, d));
}

export function somarDias(data: Date, n: number) {
  return new Date(data.getTime() + n * UM_DIA_MS);
}

/** ISO: 1 = segunda ... 7 = domingo. */
export function diaSemanaIso(data: Date) {
  const d = data.getUTCDay();
  return d === 0 ? 7 : d;
}

/** Instante UTC correspondente a "hh:mm" no horário de Brasília daquele dia. */
export function horaLocal(data: Date, hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(data.getTime() + ((h + FUSO_HORAS) * 60 + m) * 60 * 1000);
}

/** O dia de hoje em Brasília, no formato @db.Date. */
export function hojeLocal(agora = new Date()) {
  const local = new Date(agora.getTime() - FUSO_HORAS * 60 * 60 * 1000);
  return dia(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
}
