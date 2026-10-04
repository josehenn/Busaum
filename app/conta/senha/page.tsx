import type { Metadata } from "next";
import { AreaLogada } from "@/components/layout/area-logada";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Marca } from "@/components/layout/marca";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { areaDoPerfil, exigirSessao } from "@/server/sessao/sessao.service";
import { FormularioTrocarSenha } from "./formulario-trocar-senha";

export const metadata: Metadata = { title: "Trocar senha" };

export default async function TrocarSenha() {
  const usuario = await exigirSessao();
  const destino = areaDoPerfil(usuario.perfil);

  // Senha provisória: tela isolada, sem menu — não há outro lugar para ir antes da troca.
  if (usuario.trocarSenha) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4">
        <Marca />
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Crie sua senha</CardTitle>
            <CardDescription>
              Olá, {usuario.nome.split(" ")[0]}. Você entrou com uma senha provisória; escolha uma
              senha só sua para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormularioTrocarSenha provisoria destino={destino} />
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <AreaLogada area={usuario.perfil === PerfilUsuario.ADMIN ? "admin" : "aluno"} usuario={usuario}>
      <CabecalhoPagina
        titulo="Trocar senha"
        descricao="Ao trocar, as sessões abertas em outros aparelhos são encerradas."
      />
      <FormularioTrocarSenha provisoria={false} destino={destino} />
    </AreaLogada>
  );
}
