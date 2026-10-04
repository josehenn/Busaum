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
import { filtroAlunosSchema } from "@/lib/esquemas/aluno";
import { rotuloTurno } from "@/lib/rotulos";
import { alunoService } from "@/server/alunos";
import { FiltroAlunos } from "./_componentes/filtro-alunos";
import { StatusAlunoBadge } from "./_componentes/status-aluno";

export const metadata: Metadata = { title: "Alunos" };

export default async function Alunos({ searchParams }: PageProps<"/admin/alunos">) {
  const filtro = filtroAlunosSchema.parse(await searchParams);
  const alunos = await alunoService.listar(filtro);
  const filtrando = Boolean(filtro.busca || filtro.status);

  return (
    <>
      <CabecalhoPagina
        titulo="Alunos"
        descricao="Cadastro dos estudantes que usam o transporte. Cada aluno tem seu próprio acesso."
        acoes={
          <Button nativeButton={false} render={<Link href="/admin/alunos/novo" />}>
            <PlusIcon />
            Novo aluno
          </Button>
        }
      />

      <FiltroAlunos busca={filtro.busca} status={filtro.status} />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Instituição</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Turno</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  {filtrando ? "Nenhum aluno encontrado com estes filtros." : "Nenhum aluno cadastrado."}
                </TableCell>
              </TableRow>
            )}
            {alunos.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <p className="font-medium">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.email}</p>
                </TableCell>
                <TableCell title={a.instituicao.nome}>{a.instituicao.sigla ?? a.instituicao.nome}</TableCell>
                <TableCell>{a.curso}</TableCell>
                <TableCell>{rotuloTurno[a.turno]}</TableCell>
                <TableCell className="font-mono text-xs">{a.matricula ?? "—"}</TableCell>
                <TableCell className="text-center">
                  <StatusAlunoBadge status={a.status} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Editar ${a.nome}`}
                    nativeButton={false}
                    render={<Link href={`/admin/alunos/${a.id}`} />}
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
