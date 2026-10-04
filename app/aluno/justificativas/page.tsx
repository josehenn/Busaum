import type { Metadata } from "next";
import { PaperclipIcon } from "lucide-react";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusJustificativaBadge } from "@/components/status-justificativa";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { formatarData } from "@/lib/datas";
import { rotuloMotivoJustificativa } from "@/lib/rotulos";
import { justificativaService } from "@/server/justificativas";
import { JANELA_JUSTIFICATIVA_DIAS } from "@/server/justificativas/justificativa.service";
import { exigirPerfil } from "@/server/sessao/sessao.service";
import { FormularioJustificativa } from "./formulario-justificativa";

export const metadata: Metadata = { title: "Justificativas" };

export default async function MinhasJustificativas() {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);
  const [faltas, enviadas] = await Promise.all([
    justificativaService.faltasJustificaveis(usuario.alunoId!),
    justificativaService.listarDoAluno(usuario.alunoId!),
  ]);

  return (
    <>
      <CabecalhoPagina
        titulo="Justificativas"
        descricao="Faltou num dia contratado? Com comprovante e aprovação da administração, a diária daquele dia não é cobrada."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Justificar uma falta</CardTitle>
          <CardDescription>
            Vale para o dia inteiro, nos últimos {JANELA_JUSTIFICATIVA_DIAS} dias. Se você usou a ida ou a volta, a
            diária é devida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {faltas.length > 0 ? (
            <FormularioJustificativa faltas={faltas} />
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma falta para justificar.</p>
          )}
        </CardContent>
      </Card>

      <h2 className="mb-2 font-medium">Enviadas</h2>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Falta</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-center">Anexo</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enviadas.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Você ainda não enviou justificativas.
                </TableCell>
              </TableRow>
            )}
            {enviadas.map((j) => (
              <TableRow key={j.id} className="align-top">
                <TableCell>
                  <p className="tabular-nums">{formatarData(j.viagem.data)}</p>
                  <p className="text-xs text-muted-foreground">{j.viagem.rota}</p>
                </TableCell>
                <TableCell className="max-w-80 whitespace-normal">
                  <p>{rotuloMotivoJustificativa[j.motivo]}</p>
                  {j.observacaoDecisao && (
                    <p className="text-xs text-muted-foreground">Administração: {j.observacaoDecisao}</p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <a href={j.anexoUrl} target="_blank" rel="noreferrer" aria-label="Ver anexo">
                    <PaperclipIcon className="mx-auto size-4" />
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <StatusJustificativaBadge status={j.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
