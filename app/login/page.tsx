import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Marca } from "@/components/layout/marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { caminhoInterno } from "@/lib/redirecionamento";
import {
  areaDoPerfil,
  obterUsuarioAtual,
  ROTA_TROCAR_SENHA,
} from "@/server/sessao/sessao.service";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar" };

export default async function Login({ searchParams }: PageProps<"/login">) {
  const proxima = caminhoInterno((await searchParams).proxima);

  // Já logado: vai direto para onde deve (é também o destino depois do login).
  const usuario = await obterUsuarioAtual();
  if (usuario) {
    if (usuario.trocarSenha) redirect(ROTA_TROCAR_SENHA);
    redirect(proxima ?? areaDoPerfil(usuario.perfil));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Marca />
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Use o e-mail e a senha cadastrados. Aluno novo entra pelo link de convite enviado pela
            administração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormularioEntrar proxima={proxima} />
        </CardContent>
      </Card>
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
        <ArrowLeftIcon />
        Voltar para a página inicial
      </Button>
    </main>
  );
}
