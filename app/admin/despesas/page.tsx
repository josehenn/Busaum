import type { Metadata } from "next";
import Link from "next/link";
import { PaperclipIcon, PencilIcon, PlusIcon } from "lucide-react";
import { NavegadorMes } from "@/components/formulario/navegador-mes";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { competenciaDe, formatarData, hojeLocal } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { filtroDespesasSchema } from "@/lib/esquemas/despesa";
import { rotuloCategoriaDespesa } from "@/lib/rotulos";
import { despesaService } from "@/server/despesas";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Despesas" };

export default async function Despesas({ searchParams }: PageProps<"/admin/despesas">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const filtro = filtroDespesasSchema.parse(await searchParams);
  const atual = competenciaDe(hojeLocal());
  const mes = filtro.mes ?? atual;
  const { despesas, total } = await despesaService.listar({ ...filtro, mes });

  return (
    <>
      <CabecalhoPagina
        titulo="Despesas"
        descricao="Tudo o que é lançado aqui aparece na página pública de transparência (sem os comprovantes)."
        acoes={
          <Button nativeButton={false} render={<Link href="/admin/despesas/nova" />}>
            <PlusIcon />
            Nova despesa
          </Button>
        }
      />
      <div className="mb-4">
        <NavegadorMes mes={mes} maximo={atual} />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Veículo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-20">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma despesa neste mês.
                </TableCell>
              </TableRow>
            )}
            {despesas.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="text-center tabular-nums">{formatarData(d.data)}</TableCell>
                <TableCell>{rotuloCategoriaDespesa[d.categoria]}</TableCell>
                <TableCell>{d.descricao}</TableCell>
                <TableCell className="font-mono text-xs">{d.veiculo?.placa ?? "Geral"}</TableCell>
                <TableCell className="text-right tabular-nums">{formatarReais(d.valor)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {d.comprovanteUrl && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Ver comprovante"
                        nativeButton={false}
                        render={<a href={d.comprovanteUrl} target="_blank" rel="noreferrer" />}
                      >
                        <PaperclipIcon />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar ${d.descricao}`}
                      nativeButton={false}
                      render={<Link href={`/admin/despesas/${d.id}`} />}
                    >
                      <PencilIcon />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          {despesas.length > 0 && (
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>Total do mês</TableCell>
                <TableCell className="text-right tabular-nums">{formatarReais(total)}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </>
  );
}
