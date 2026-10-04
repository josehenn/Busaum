"use server";

import { redirect } from "next/navigation";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { entrar, sair } from "@/server/sessao/sessao.service";

export async function entrarComo(formData: FormData) {
  const usuarioId = formData.get("usuarioId");
  const perfil = typeof usuarioId === "string" ? await entrar(usuarioId) : null;

  if (perfil === PerfilUsuario.ADMIN) redirect("/admin");
  if (perfil === PerfilUsuario.ALUNO) redirect("/aluno");
  redirect("/login");
}

export async function sairDaSessao() {
  await sair();
  redirect("/login");
}
