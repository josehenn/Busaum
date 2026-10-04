import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlertIcon } from "lucide-react";
import { z } from "zod";
import { NavegadorDia } from "@/components/formulario/navegador-dia";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { dataIso, hojeLocal } from "@/lib/datas";
import { viagemService } from "@/server/viagens";
import { StatusViagemBadge } from "./_componentes/status-viagem";

export const metadata: Metadata = { title: "Viagens" };

export default async function Viagens({ searchParams }: PageProps<"/admin/viagens">) {
  const hoje = dataIso(hojeLocal());
  const dia = z.iso.date().catch(hoje).parse((await searchParams).dia);
  const viagens = await viagemService.listarDoDia(dia);

  return (
    <>
      <CabecalhoPagina
        titulo="Viagens"
        descricao="Geradas automaticamente para os próximos 14 dias. Quem não avisou ausência conta como presente."
      />
      <NavegadorDia dia={dia} hoje={hoje} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead className="text-center">Ida / volta</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead className="text-center">Na ida</TableHead>
              <TableHead className="text-center">Na volta</TableHead>
              <TableHead className="text-center">Ausentes</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viagens.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Nenhuma viagem neste dia.
                </TableCell>
              </TableRow>
            )}
            {viagens.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <Link href={`/admin/viagens/${v.id}`} className="font-medium hover:underline">
                    {v.rota.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.horarioIda} / {v.horarioVolta}
                </TableCell>
                <TableCell className="font-mono text-xs">{v.veiculo.placa}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.ida}/{v.capacidade}
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {v.volta}/{v.capacidade}
                </TableCell>
                <TableCell className="text-center tabular-nums">{v.ausentes}</TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <StatusViagemBadge status={v.status} />
                    {v.acimaDaCapacidade && (
                      <TriangleAlertIcon className="size-4 text-destructive" aria-label="Acima da capacidade" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
