import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { navegacao } from "@/components/layout/navegacao";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Início" };

const descricoes: Record<string, string> = {
  "/aluno/viagens": "Veja as próximas viagens, avise quando não for ou peça um dia avulso.",
  "/aluno/justificativas": "Envie o atestado ou comprovante de uma falta para isentar a diária.",
  "/aluno/mensalidades": "Acompanhe as diárias de cada mês e o status do pagamento.",
};

export default async function InicioAluno() {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);
  const primeiroNome = usuario.nome.split(" ")[0];
  const atalhos = navegacao.aluno.filter((item) => item.href in descricoes);

  return (
    <>
      <CabecalhoPagina titulo={`Olá, ${primeiroNome}`} descricao="O que você quer fazer hoje?" />
      <div className="grid gap-4 md:grid-cols-3">
        {atalhos.map(({ href, rotulo, icone: Icone }) => (
          <Link key={href} href={href} className="rounded-xl transition-shadow hover:shadow-md">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icone className="size-4" />
                  {rotulo}
                </CardTitle>
                <CardDescription>{descricoes[href]}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
