// Regras de senha e de entrada, compartilhadas entre as telas e o servidor.
import { z } from "zod";

export const LIMITES_SENHA = { min: 8, max: 128 } as const;

/** Senha nova: 8 a 128 caracteres, com ao menos uma letra e um número. */
export const senhaNova = z
  .string({ error: "Informe a senha." })
  .min(1, { error: "Informe a senha.", abort: true })
  .min(LIMITES_SENHA.min, { error: `A senha precisa ter ao menos ${LIMITES_SENHA.min} caracteres.`, abort: true })
  .max(LIMITES_SENHA.max, { error: `A senha pode ter no máximo ${LIMITES_SENHA.max} caracteres.`, abort: true })
  .refine((s) => /[A-Za-z]/.test(s) && /\d/.test(s), "Use ao menos uma letra e um número.");

export const confirmacaoSenha = z.string({ error: "Confirme a senha." }).min(1, "Confirme a senha.");

export const entrarSchema = z.object({
  email: z
    .string({ error: "Informe o e-mail." })
    .trim()
    .toLowerCase()
    .min(1, { error: "Informe o e-mail.", abort: true })
    .pipe(z.email("E-mail inválido.")),
  // Na entrada não se valida formato: só "preencheu?" (e o teto, contra abuso).
  senha: z
    .string({ error: "Informe a senha." })
    .min(1, "Informe a senha.")
    .max(LIMITES_SENHA.max, "Senha inválida."),
});

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string({ error: "Informe a senha atual." }).min(1, "Informe a senha atual."),
    novaSenha: senhaNova,
    confirmacao: confirmacaoSenha,
  })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  })
  .refine((dados) => dados.senhaAtual !== dados.novaSenha, {
    message: "A nova senha precisa ser diferente da atual.",
    path: ["novaSenha"],
  });

/**
 * Primeira senha (quem entrou com a provisória): não pede a atual — a pessoa
 * acabou de digitá-la no login, e só chega aqui com essa sessão.
 */
export const definirPrimeiraSenhaSchema = z
  .object({ novaSenha: senhaNova, confirmacao: confirmacaoSenha })
  .refine((dados) => dados.novaSenha === dados.confirmacao, {
    message: "As senhas não conferem.",
    path: ["confirmacao"],
  });

export type EntrarDTO = z.output<typeof entrarSchema>;
export type TrocarSenhaDTO = z.output<typeof trocarSenhaSchema>;
