import type { Metadata } from "next";
import Link from "next/link";
import { Marca } from "@/components/layout/marca";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErroExpirado } from "@/server/comum/erros";
import { conviteService } from "@/server/convites";
import { instituicaoService } from "@/server/instituicoes";
import { FormularioCadastro } from "./formulario-cadastro";

export const metadata: Metadata = {
  title: "Cadastro de aluno",
  // O link carrega o token: não deixa buscadores nem o Referer o espalharem.
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function Cadastro({ params }: PageProps<"/cadastro/[token]">) {
  const { token } = await params;

  let email: string | null;
  try {
    ({ email } = await conviteService.verificar(token));
  } catch (erro) {
    if (!(erro instanceof ErroExpirado)) throw erro;
    return (
      <Moldura titulo="Convite indisponível" descricao={erro.message}>
        <Button nativeButton={false} render={<Link href="/login" />} className="w-full">
          Ir para o login
        </Button>
      </Moldura>
    );
  }

  const instituicoes = await instituicaoService.listar();
  return (
    <Moldura
      titulo="Cadastro de aluno"
      descricao="Preencha seus dados e crie sua senha de acesso ao Busaum."
      largo
    >
      <FormularioCadastro token={token} emailFixo={email} instituicoes={instituicoes} />
    </Moldura>
  );
}

function Moldura({
  titulo,
  descricao,
  largo,
  children,
}: {
  titulo: string;
  descricao: string;
  largo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Marca />
      <Card className={largo ? "w-full max-w-2xl" : "w-full max-w-sm"}>
        <CardHeader>
          <CardTitle>{titulo}</CardTitle>
          <CardDescription>{descricao}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  );
}
