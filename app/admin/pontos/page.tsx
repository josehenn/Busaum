import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { FiltroLista } from "@/components/formulario/filtro-lista";
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
import { filtroPontosSchema } from "@/lib/esquemas/ponto";
import { pontoService } from "@/server/pontos";

export const metadata: Metadata = { title: "Pontos" };

export default async function Pontos({ searchParams }: PageProps<"/admin/pontos">) {
  const filtro = filtroPontosSchema.parse(await searchParams);
  const pontos = await pontoService.listar(filtro);
  const filtrando = Boolean(filtro.busca || filtro.status);

  return (
    <>
      <CabecalhoPagina
        titulo="Pontos"
        descricao="Lugares onde os veículos param. Um mesmo ponto pode estar em várias rotas."
        acoes={
          <Button nativeButton={false} render={<Link href="/admin/pontos/novo" />}>
            <PlusIcon />
            Novo ponto
          </Button>
        }
      />

      <FiltroLista
        placeholder="Buscar por descrição, rua, bairro ou cidade"
        opcoesStatus={[
          { value: "ATIVO", label: "Ativos" },
          { value: "INATIVO", label: "Inativos" },
        ]}
        busca={filtro.busca}
        status={filtro.status}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ponto</TableHead>
              <TableHead>Campus de</TableHead>
              <TableHead className="text-center">Rotas</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pontos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {filtrando ? "Nenhum ponto encontrado com estes filtros." : "Nenhum ponto cadastrado."}
                </TableCell>
              </TableRow>
            )}
            {pontos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{p.descricao}</p>
                  {p.endereco && <p className="text-xs text-muted-foreground">{p.endereco}</p>}
                </TableCell>
                <TableCell>{p.instituicao ? (p.instituicao.sigla ?? p.instituicao.nome) : "—"}</TableCell>
                <TableCell
                  className="text-center tabular-nums"
                  title={p.rotas.map((r) => r.nome).join(", ") || undefined}
                >
                  {p.rotas.length}
                </TableCell>
                <TableCell className="text-center">
                  <StatusAtivoBadge ativo={p.ativo} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${p.descricao}`}
                    nativeButton={false}
                    render={<Link href={`/admin/pontos/${p.id}`} />}
                  >
                    <PencilIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
