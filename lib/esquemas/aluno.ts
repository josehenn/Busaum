// Regras de entrada do aluno, compartilhadas entre o service e o formulário.
import { z } from "zod";
import { StatusAluno, Turno } from "@/lib/generated/prisma/enums";
import { apenasDigitos } from "@/lib/mascaras";

export const LIMITES_ALUNO = {
  nomeMin: 3,
  nomeMax: 120,
  emailMax: 120,
  instituicaoMin: 2,
  instituicaoMax: 120,
  matriculaMax: 30,
  cursoMin: 2,
  cursoMax: 80,
} as const;

/** Dígitos verificadores do CPF (módulo 11). Rejeita também 000..., 111... */
export function cpfValido(cpf: string) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const nums = cpf.split("").map(Number);
  for (const tamanho of [9, 10]) {
    const soma = nums
      .slice(0, tamanho)
      .reduce((total, n, i) => total + n * (tamanho + 1 - i), 0);
    const resto = (soma * 10) % 11;
    if ((resto === 10 ? 0 : resto) !== nums[tamanho]) return false;
  }
  return true;
}

/** Texto obrigatório com limites; vazio dá só "Informe ...", sem somar mensagens. */
function texto(rotulo: string, min: number, max: number, artigo = "o") {
  return z
    .string({ error: `Informe ${artigo} ${rotulo}.` })
    .trim()
    .min(1, { error: `Informe ${artigo} ${rotulo}.`, abort: true })
    .min(min, `${capitalizar(artigo)} ${rotulo} precisa ter ao menos ${min} caracteres.`)
    .max(max, `${capitalizar(artigo)} ${rotulo} pode ter no máximo ${max} caracteres.`);
}
const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const nome = texto("nome", LIMITES_ALUNO.nomeMin, LIMITES_ALUNO.nomeMax);
const curso = texto("curso", LIMITES_ALUNO.cursoMin, LIMITES_ALUNO.cursoMax);
/**
 * Opcional: nem todo aluno tem a matrícula em mãos no cadastro. Vazio vira null
 * (sem matrícula); no PATCH, ausente = não mexe, "" = apaga.
 */
const matricula = z
  .string({ error: "Matrícula inválida." })
  .trim()
  .max(LIMITES_ALUNO.matriculaMax, `A matrícula pode ter no máximo ${LIMITES_ALUNO.matriculaMax} caracteres.`)
  .transform((valor) => (valor === "" ? null : valor))
  .nullish();

const email = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .min(1, { error: "Informe o e-mail.", abort: true })
  .max(LIMITES_ALUNO.emailMax, `O e-mail pode ter no máximo ${LIMITES_ALUNO.emailMax} caracteres.`)
  .pipe(z.email("E-mail inválido."));

/** Aceita com ou sem máscara; guarda só os 11 dígitos. */
const cpf = z
  .string({ error: "Informe o CPF." })
  .transform(apenasDigitos)
  .pipe(
    z
      .string()
      .min(1, { error: "Informe o CPF.", abort: true })
      .length(11, { error: "O CPF tem 11 dígitos.", abort: true })
      .refine(cpfValido, "CPF inválido."),
  );

/** DDD + número: 10 dígitos (fixo) ou 11 (celular). Guarda só os dígitos. */
const telefone = z
  .string({ error: "Informe o telefone." })
  .transform(apenasDigitos)
  .pipe(
    z
      .string()
      .min(1, { error: "Informe o telefone.", abort: true })
      .regex(/^\d{10,11}$/, "Informe o telefone com DDD (10 ou 11 dígitos)."),
  );

/**
 * Texto livre: nome ou sigla de uma instituição já cadastrada, ou o nome de uma
 * nova. Quem decide entre vincular e criar é o service.
 */
const instituicao = texto(
  "instituição",
  LIMITES_ALUNO.instituicaoMin,
  LIMITES_ALUNO.instituicaoMax,
  "a",
);

/** "AAAA-MM-DD" do <input type="date"> → meia-noite UTC daquele dia. */
const inicioEm = z
  .string({ error: "Informe a data de início." })
  .min(1, { error: "Informe a data de início.", abort: true })
  .pipe(z.iso.date("Data inválida."))
  .transform((data) => new Date(`${data}T00:00:00Z`));

const turno = z.enum(Turno, { error: "Escolha o turno." });
const status = z.enum(StatusAluno, { error: "Escolha um status válido." });

export const criarAlunoSchema = z.object({
  nome,
  email,
  cpf,
  telefone,
  instituicao,
  matricula,
  curso,
  turno,
  inicioEm,
});

/** Sem CPF: o documento é a identidade do aluno e não muda depois do cadastro. */
export const atualizarAlunoSchema = z
  .object({ nome, email, telefone, instituicao, matricula, curso, turno, inicioEm, status })
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar.");

/** Filtros da listagem (query string). Valores desconhecidos são ignorados. */
export const filtroAlunosSchema = z.object({
  busca: z.string().trim().max(100).optional().catch(undefined),
  status: z.enum(StatusAluno).optional().catch(undefined),
});

export type CriarAlunoDTO = z.output<typeof criarAlunoSchema>;
export type AtualizarAlunoDTO = z.output<typeof atualizarAlunoSchema>;
export type FiltroAlunos = z.output<typeof filtroAlunosSchema>;
