"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/server/auth/auth";

/** Apaga a sessão no banco (o cookie antigo deixa de valer) e limpa o cookie. */
export async function sairDaSessao() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}
