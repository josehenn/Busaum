// O banco guarda instantes em UTC; a operação acontece no horário de Brasília
// (UTC-3, sem horário de verão desde 2019). Toda conversão entre os dois passa
// por aqui, para nenhuma tela ou service fazer essa conta por conta própria.
//
// Só aritmética em UTC: o resultado não depende do fuso do servidor nem do
// navegador.

export const FUSO_HORAS = 3;
export const UM_DIA_MS = 24 * 60 * 60 * 1000;
const FUSO_MS = FUSO_HORAS * 60 * 60 * 1000;

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
  const local = new Date(agora.getTime() - FUSO_MS);
  return dia(local.getUTCFullYear(), local.getUTCMonth() + 1, local.getUTCDate());
}

/** "hh:mm" → valor para coluna @db.Time (só a hora importa). */
export function horarioParaTime(hhmm: string) {
  return horaLocal(new Date(0), hhmm);
}

/** Instante (ou coluna @db.Time) → "hh:mm" no horário de Brasília. */
export function horarioLocal(instante: Date | string) {
  const local = new Date(new Date(instante).getTime() - FUSO_MS);
  return local.toISOString().slice(11, 16);
}

/** Data @db.Date → "AAAA-MM-DD". */
export function dataIso(data: Date) {
  return data.toISOString().slice(0, 10);
}

/** "AAAA-MM-DD" → data @db.Date. */
export function dataDeIso(texto: string) {
  return new Date(`${texto}T00:00:00Z`);
}

/** "AAAA-MM-DD" ou data @db.Date → "dd/mm/aaaa". */
export function formatarData(data: Date | string) {
  const [ano, mes, d] = (typeof data === "string" ? data : dataIso(data)).slice(0, 10).split("-");
  return `${d}/${mes}/${ano}`;
}

/** Instante → "dd/mm/aaaa hh:mm" no horário de Brasília. */
export function formatarDataHora(instante: Date | string) {
  const local = new Date(new Date(instante).getTime() - FUSO_MS).toISOString();
  return `${formatarData(local)} ${local.slice(11, 16)}`;
}

export const DIAS_SEMANA = [1, 2, 3, 4, 5, 6, 7] as const;

export const nomeDiaCurto: Record<number, string> = {
  1: "Seg", 2: "Ter", 3: "Qua", 4: "Qui", 5: "Sex", 6: "Sáb", 7: "Dom",
};

export const nomeDiaLongo: Record<number, string> = {
  1: "segunda", 2: "terça", 3: "quarta", 4: "quinta", 5: "sexta", 6: "sábado", 7: "domingo",
};

/** [1, 2, 3, 4, 5] → "Seg a Sex"; [2, 4] → "Ter, Qui". */
export function descreverDias(dias: number[]) {
  const ordenados = [...dias].sort((a, b) => a - b);
  const sequencia = ordenados.every((d, i) => i === 0 || d === ordenados[i - 1] + 1);
  if (sequencia && ordenados.length >= 3) {
    return `${nomeDiaCurto[ordenados[0]]} a ${nomeDiaCurto[ordenados.at(-1)!]}`;
  }
  return ordenados.map((d) => nomeDiaCurto[d]).join(", ");
}

// ---------------------------------------------------------------- Competência
// Mês de cobrança, no formato "AAAA-MM".

export function competenciaDe(data: Date) {
  return dataIso(data).slice(0, 7);
}

export function inicioDaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return dia(ano, mes, 1);
}

/** Primeiro dia do mês seguinte (fim exclusivo da competência). */
export function fimDaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return dia(ano, mes + 1, 1);
}

const nomesMeses = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** "2026-09" → "setembro/2026" */
export function formatarCompetencia(competencia: string) {
  const [ano, mes] = competencia.split("-").map(Number);
  return `${nomesMeses[mes - 1]}/${ano}`;
}
