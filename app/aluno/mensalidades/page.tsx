import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusMensalidadeBadge } from "@/components/mensalidades/status-mensalidade";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { formatarCompetencia, formatarData } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { mensalidadeService } from "@/server/mensalidades";
import { DIA_VENCIMENTO } from "@/server/mensalidades/mensalidade.service";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Mensalidades" };

export default async function MinhasMensalidades() {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);
  const lista = await mensalidadeService.listarDoAluno(usuario.alunoId!);

  return (
    <>
      <CabecalhoPagina
        titulo="Mensalidades"
        descricao={`Cada mês é a soma das diárias dos dias contratados (e dos avulsos). Fecha no início do mês seguinte e vence no dia ${DIA_VENCIMENTO}.`}
      />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead className="text-center">Diárias</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Vencimento</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  Nenhuma mensalidade ainda.
                </TableCell>
              </TableRow>
            )}
            {lista.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <Link href={`/aluno/mensalidades/${m.id}`} className="font-medium capitalize hover:underline">
                    {formatarCompetencia(m.competencia)}
                  </Link>
                </TableCell>
                <TableCell className="text-center tabular-nums">{m.diariasCobradas}</TableCell>
                <TableCell className="text-right tabular-nums">{formatarReais(m.valor)}</TableCell>
                <TableCell className="text-center tabular-nums">{formatarData(m.vencimentoEm.slice(0, 10))}</TableCell>
                <TableCell className="text-center">
                  <StatusMensalidadeBadge status={m.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
