import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon } from "lucide-react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rotuloTipoVeiculo } from "@/lib/rotulos";
import { veiculoService } from "@/server/veiculos";
import { StatusVeiculoBadge } from "./_componentes/status-veiculo";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Veículos" };

export default async function Veiculos() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  // Server Component chama o service direto, sem passar pela própria API.
  const veiculos = await veiculoService.listar();

  return (
    <>
      <CabecalhoPagina
        titulo="Veículos"
        descricao="Frota usada nas rotas. A capacidade limita quantos alunos cada rota aceita por dia."
        acoes={
          <Button nativeButton={false} render={<Link href="/admin/veiculos/novo" />}>
            <PlusIcon />
            Novo veículo
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Placa</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead className="text-center">Capacidade</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {veiculos.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum veículo cadastrado.
                </TableCell>
              </TableRow>
            )}
            {veiculos.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-mono font-medium">{v.placa}</TableCell>
                <TableCell>{rotuloTipoVeiculo[v.tipo]}</TableCell>
                <TableCell>{v.modelo}</TableCell>
                <TableCell className="text-center tabular-nums">{v.capacidade}</TableCell>
                <TableCell className="text-center">
                  <StatusVeiculoBadge status={v.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${v.placa}`}
                    nativeButton={false}
                    render={<Link href={`/admin/veiculos/${v.id}`} />}
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
