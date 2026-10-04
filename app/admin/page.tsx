import type { Metadata } from "next";
import Link from "next/link";
import { BusIcon, CalendarDaysIcon, FileCheckIcon, UsersIcon, WalletIcon } from "lucide-react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { obterResumoAdmin } from "@/server/painel/painel.service";

export const metadata: Metadata = { title: "Painel" };

export default async function PainelAdmin() {
  const resumo = await obterResumoAdmin();

  const indicadores = [
    { rotulo: "Veículos ativos", valor: resumo.veiculosAtivos, href: "/admin/veiculos", icone: BusIcon },
    { rotulo: "Alunos ativos", valor: resumo.alunosAtivos, href: "/admin/alunos", icone: UsersIcon },
    { rotulo: "Viagens hoje", valor: resumo.viagensHoje, href: "/admin/viagens", icone: CalendarDaysIcon },
    {
      rotulo: "Justificativas pendentes",
      valor: resumo.justificativasPendentes,
      href: "/admin/justificativas",
      icone: FileCheckIcon,
    },
    {
      rotulo: "Mensalidades em aberto",
      valor: resumo.mensalidadesEmAberto,
      href: "/admin/mensalidades",
      icone: WalletIcon,
    },
  ];

  return (
    <>
      <CabecalhoPagina titulo="Painel" descricao="Visão geral da operação." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {indicadores.map(({ rotulo, valor, href, icone: Icone }) => (
          <Link key={href} href={href} className="rounded-xl transition-shadow hover:shadow-md">
            <Card>
              <CardHeader>
                <CardDescription className="flex items-center gap-2">
                  <Icone className="size-4" />
                  {rotulo}
                </CardDescription>
                <CardTitle className="text-3xl tabular-nums">{valor}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
