// Endpoints do Better Auth (/api/auth/sign-in/email, /sign-out, /change-password...).
// O limite de tentativas e a checagem de origem rodam aqui, por isso as telas
// chamam estes endpoints (lib/auth-client.ts) em vez de auth.api direto.
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/server/auth/auth";

export const { GET, POST } = toNextJsHandler(auth);
