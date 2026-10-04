// Senhas criadas pelo próprio sistema (seed, cadastro pelo admin, convite). O
// hash usa a mesma função do Better Auth (scrypt), então o login as reconhece.
import { randomInt } from "node:crypto";
import { hashPassword } from "better-auth/crypto";

/** providerId da conta de e-mail e senha no Better Auth. */
export const PROVEDOR_SENHA = "credential";

export function hashSenha(senha: string) {
  return hashPassword(senha);
}

// Sem caracteres que se confundem ao ditar ou copiar à mão (0/O, 1/l/I).
const ALFABETO = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Senha provisória legível: 10 caracteres (~57 bits), sempre com letra e número. */
export function gerarSenhaProvisoria() {
  for (;;) {
    const senha = Array.from({ length: 10 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
    if (/[A-Za-z]/.test(senha) && /\d/.test(senha)) return senha;
  }
}
