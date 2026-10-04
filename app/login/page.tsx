import type { Metadata } from "next";
import { connection } from "next/server";
import { ShieldCheckIcon, UserIcon } from "lucide-react";
import { Marca } from "@/components/layout/marca";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerfilUsuario, StatusAluno } from "@/lib/generated/prisma/enums";
import { rotuloStatusAluno } from "@/lib/rotulos";
import { listarUsuariosParaEntrada } from "@/server/sessao/sessao.service";
import { entrarComo } from "./actions";

export const metadata: Metadata = { title: "Entrar" };

export default async function Login() {
  // A lista vem do banco: sem isto o build pré-renderiza a página com os usuários
  // daquele momento (e falha na Vercel, onde o build não tem banco).
  await connection();
  const usuarios = await listarUsuariosParaEntrada();
  const admins = usuarios.filter((u) => u.perfil === PerfilUsuario.ADMIN);
  const alunos = usuarios.filter((u) => u.perfil === PerfilUsuario.ALUNO);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-4">
      <Marca />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Acesso de demonstração: escolha com qual usuário entrar. O login com senha chega
            junto com a autenticação, em uma próxima entrega.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {usuarios.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhum usuário cadastrado. Rode <code>npm run db:seed</code> para criar os dados de
              exemplo.
            </p>
          )}

          {admins.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Administração
              </h2>
              {admins.map((u) => (
                <OpcaoUsuario key={u.id} id={u.id} nome={u.nome} detalhe={u.email} admin />
              ))}
            </section>
          )}

          {alunos.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Alunos
              </h2>
              {alunos.map((u) => (
                <OpcaoUsuario
                  key={u.id}
                  id={u.id}
                  nome={u.nome}
                  detalhe={u.aluno ? `${u.aluno.curso} · ${u.aluno.instituicao.sigla ?? u.aluno.instituicao.nome}` : u.email}
                  status={u.aluno && u.aluno.status !== StatusAluno.ATIVO ? rotuloStatusAluno[u.aluno.status] : undefined}
                />
              ))}
            </section>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function OpcaoUsuario({
  id,
  nome,
  detalhe,
  admin,
  status,
}: {
  id: string;
  nome: string;
  detalhe: string;
  admin?: boolean;
  status?: string;
}) {
  const Icone = admin ? ShieldCheckIcon : UserIcon;

  return (
    <form action={entrarComo}>
      <input type="hidden" name="usuarioId" value={id} />
      <button
        type="submit"
        className="flex w-full items-center gap-3 rounded-lg border bg-background px-3 py-2.5 text-left transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <Icone className="size-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{nome}</span>
          <span className="block truncate text-xs text-muted-foreground">{detalhe}</span>
        </span>
        {status && <Badge variant="secondary">{status}</Badge>}
      </button>
    </form>
  );
}
