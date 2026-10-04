import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon, PencilIcon, PlusIcon } from "lucide-react";
import { FiltroLista } from "@/components/formulario/filtro-lista";
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
import { opcoes, rotuloStatusAluno, rotuloTurno } from "@/lib/rotulos";
import { alunoService } from "@/server/alunos";
import { StatusAlunoBadge } from "./_componentes/status-aluno";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Alunos" };

export default async function Alunos({ searchParams }: PageProps<"/admin/alunos">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const filtro = filtroAlunosSchema.parse(await searchParams);
  const alunos = await alunoService.listar(filtro);
  const filtrando = Boolean(filtro.busca || filtro.status);

  return (
    <>
      <CabecalhoPagina
        titulo="Alunos"
        descricao="Cadastro dos estudantes que usam o transporte. Cada aluno tem seu próprio acesso."
        acoes={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/alunos/convites" />}>
              <LinkIcon />
              Convites
            </Button>
            <Button nativeButton={false} render={<Link href="/admin/alunos/novo" />}>
              <PlusIcon />
              Novo aluno
            </Button>
          </>
        }
      />

      <FiltroLista
        placeholder="Buscar por nome, e-mail ou matrícula"
        opcoesStatus={opcoes(rotuloStatusAluno)}
        busca={filtro.busca}
        status={filtro.status}
      />

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
