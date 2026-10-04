import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarDataHora } from "@/lib/datas";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { conviteService, type SituacaoConvite } from "@/server/convites";
import { exigirPerfil } from "@/server/sessao/sessao.service";
import { NovoConvite } from "./novo-convite";

export const metadata: Metadata = { title: "Convites" };

const rotuloSituacao: Record<SituacaoConvite, string> = {
  PENDENTE: "Pendente",
  USADO: "Usado",
  EXPIRADO: "Expirado",
  REVOGADO: "Revogado",
};

const varianteSituacao = {
  PENDENTE: "default",
  USADO: "secondary",
  EXPIRADO: "outline",
  REVOGADO: "outline",
} as const;

export default async function Convites() {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const convites = await conviteService.listar();

  return (
    <>
      <CabecalhoPagina
        titulo="Convites de cadastro"
        descricao="Links para o próprio aluno se cadastrar e criar a senha. Cada link é de uso único."
        acoes={
          <>
            <Button variant="outline" nativeButton={false} render={<Link href="/admin/alunos" />}>
              <ArrowLeftIcon />
              Alunos
            </Button>
            <NovoConvite />
          </>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Para</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Válido até</TableHead>
              <TableHead>Aluno cadastrado</TableHead>
              <TableHead className="text-center">Situação</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {convites.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhum convite gerado.
                </TableCell>
              </TableRow>
            )}
            {convites.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.email ?? <span className="text-muted-foreground">Qualquer e-mail</span>}</TableCell>
                <TableCell>{formatarDataHora(c.criadoEm)}</TableCell>
                <TableCell>{formatarDataHora(c.expiraEm)}</TableCell>
                <TableCell>
                  {c.aluno ? (
                    <Link href={`/admin/alunos/${c.aluno.id}`} className="underline-offset-4 hover:underline">
                      {c.aluno.nome}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={varianteSituacao[c.situacao]}>{rotuloSituacao[c.situacao]}</Badge>
                </TableCell>
                <TableCell>
                  {c.situacao === "PENDENTE" && (
                    <BotaoAcao
                      url={`/api/convites/${c.id}`}
                      metodo="DELETE"
                      variante="ghost"
                      mensagemSucesso="Convite revogado."
                      confirmacao={{
                        titulo: "Revogar convite?",
                        descricao: "O link deixa de funcionar imediatamente.",
                        rotuloConfirmar: "Revogar",
                        destrutiva: true,
                      }}
                    >
                      Revogar
                    </BotaoAcao>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
