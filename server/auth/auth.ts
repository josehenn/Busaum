// Configuração do Better Auth: e-mail e senha, sessão no banco, limite de
// tentativas. As tabelas são as nossas (Usuario, Sessao, Conta...): aqui só
// dizemos ao Better Auth como cada campo se chama em português.
//
// Quem usa isto é server/sessao/sessao.service.ts; telas e rotas não importam
// este arquivo direto.
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { LIMITES_SENHA } from "@/lib/esquemas/senha";

const SETE_DIAS_S = 7 * 24 * 60 * 60;
const UM_DIA_S = 24 * 60 * 60;

export const auth = betterAuth({
  appName: "Busaum",
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  // Origens aceitas nos POST do /api/auth (proteção contra CSRF). Além da
  // baseURL, as URLs que a Vercel dá a cada deploy (previews dos PRs).
  trustedOrigins: [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL]
    .filter((host): host is string => Boolean(host))
    .map((host) => `https://${host}`),

  emailAndPassword: {
    enabled: true,
    // Ninguém se cadastra pela API do Better Auth: aluno entra por convite ou
    // pelo cadastro do admin (server/convites e server/alunos).
    disableSignUp: true,
    minPasswordLength: LIMITES_SENHA.min,
    maxPasswordLength: LIMITES_SENHA.max,
    // Trocar a senha derruba as outras sessões.
    revokeSessionsOnPasswordReset: true,
  },

  user: {
    modelName: "usuario",
    fields: {
      name: "nome",
      emailVerified: "emailVerificado",
      image: "imagem",
      createdAt: "criadoEm",
      updatedAt: "atualizadoEm",
    },
    // input: false — nenhuma requisição define o próprio perfil.
    additionalFields: {
      perfil: { type: ["ADMIN", "ALUNO"], required: true, input: false },
      trocarSenha: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },

  session: {
    modelName: "sessao",
    fields: {
      userId: "usuarioId",
      expiresAt: "expiraEm",
      ipAddress: "ip",
      createdAt: "criadoEm",
      updatedAt: "atualizadoEm",
    },
    expiresIn: SETE_DIAS_S,
    updateAge: UM_DIA_S,
    // Sem cookieCache de propósito: toda checagem consulta o banco, então uma
    // sessão apagada (logout, troca de senha) deixa de valer na hora.
  },

  account: {
    modelName: "conta",
    fields: {
      userId: "usuarioId",
      password: "senha",
      createdAt: "criadoEm",
      updatedAt: "atualizadoEm",
    },
  },

  verification: {
    modelName: "verificacao",
    fields: {
      identifier: "identificador",
      value: "valor",
      expiresAt: "expiraEm",
      createdAt: "criadoEm",
      updatedAt: "atualizadoEm",
    },
  },

  rateLimit: {
    // Ligado também em dev, para dar para testar. No banco porque na Vercel
    // cada instância teria a sua contagem em memória.
    enabled: true,
    storage: "database",
    modelName: "limiteRequisicao",
    fields: { key: "chave", count: "contagem", lastRequest: "ultimaRequisicao" },
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/change-password": { window: 60, max: 5 },
    },
  },

  advanced: {
    cookiePrefix: "busaum",
    // IP do cliente para o limite de tentativas. Na Vercel, x-vercel-forwarded-for
    // é escrito pela própria plataforma (o cliente não consegue forjar).
    ipAddress: { ipAddressHeaders: ["x-vercel-forwarded-for", "x-forwarded-for"] },
    // Os ids saem do @default(cuid()) do Prisma, como no resto do sistema.
    database: { generateId: false },
  },

  hooks: {
    // Trocou a senha com sucesso → a provisória deixou de existir: libera o acesso.
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/change-password" || ctx.context.returned instanceof Error) return;
      const usuarioId = ctx.context.session?.user.id;
      if (usuarioId) {
        await prisma.usuario.update({ where: { id: usuarioId }, data: { trocarSenha: false } });
      }
    }),
  },

  // nextCookies por último: deixa as Server Actions gravarem o cookie da sessão.
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
