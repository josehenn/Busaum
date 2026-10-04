import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusAtivoBadge } from "@/components/status-ativo";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { descreverDias } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { rotaService } from "@/server/rotas";

export const metadata: Metadata = { title: "Rotas e planos" };

export default async function Rotas() {
  const rotas = await rotaService.listar();

  return (
    <>
      <CabecalhoPagina
        titulo="Rotas e planos"
        descricao="Cada rota é ida e volta no mesmo dia. Abra uma rota para ver o trajeto, a lotação e os alunos contratados."
        acoes={
          <Button nativeButton={false} render={<Link href="/admin/rotas/nova" />}>
            <PlusIcon />
            Nova rota
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rota</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead className="text-center">Ida / volta</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead className="text-center">Diária</TableHead>
              <TableHead className="text-center">Alunos</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rotas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Nenhuma rota cadastrada.
                </TableCell>
              </TableRow>
            )}
            {rotas.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-normal">
                  <Link href={`/admin/rotas/${r.id}`} className="font-medium hover:underline">
                    {r.nome}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.pontos.length} pontos · {r.pontos[0]?.descricao} → {r.pontos.at(-1)?.descricao}
                  </p>
                </TableCell>
                <TableCell className="font-mono text-xs">{r.veiculo.placa}</TableCell>
                <TableCell className="text-center tabular-nums">
                  {r.horarioIda} / {r.horarioVolta}
                </TableCell>
                <TableCell>{descreverDias(r.diasOperacao)}</TableCell>
                <TableCell className="text-center tabular-nums">{formatarReais(r.valorDiaria)}</TableCell>
                <TableCell className="text-center tabular-nums">{r.planosAbertos}</TableCell>
                <TableCell className="text-center">
                  <StatusAtivoBadge ativo={r.ativa} rotulos={["Ativa", "Inativa"]} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
