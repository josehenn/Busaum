import type { Metadata } from "next";
import { PaperclipIcon } from "lucide-react";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { FiltroLista } from "@/components/formulario/filtro-lista";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusJustificativaBadge } from "@/components/status-justificativa";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusJustificativa } from "@/lib/generated/prisma/enums";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { filtroJustificativasSchema } from "@/lib/esquemas/justificativa";
import { opcoes, rotuloMotivoJustificativa, rotuloStatusJustificativa } from "@/lib/rotulos";
import { justificativaService } from "@/server/justificativas";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Justificativas" };

export default async function Justificativas({ searchParams }: PageProps<"/admin/justificativas">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const filtro = filtroJustificativasSchema.parse(await searchParams);
  const lista = await justificativaService.listar(filtro);

  return (
    <>
      <CabecalhoPagina
        titulo="Justificativas"
        descricao="Falta justificada e aprovada isenta a diária do dia. As pendentes mais antigas aparecem primeiro."
      />
      <FiltroLista
        placeholder="Buscar pelo nome do aluno"
        opcoesStatus={opcoes(rotuloStatusJustificativa)}
        busca={filtro.busca}
        status={filtro.status}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Falta</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-center">Anexo</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-44">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lista.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Nenhuma justificativa encontrada.
                </TableCell>
              </TableRow>
            )}
            {lista.map((j) => (
              <TableRow key={j.id} className="align-top">
                <TableCell>
                  <p className="font-medium">{j.aluno.nome}</p>
                  <p className="text-xs text-muted-foreground">Enviada em {formatarDataHora(j.enviadaEm)}</p>
                </TableCell>
                <TableCell>
                  <p className="tabular-nums">{formatarData(j.viagem.data)}</p>
                  <p className="text-xs text-muted-foreground">{j.viagem.rota}</p>
                </TableCell>
                <TableCell className="max-w-72 whitespace-normal">
                  <p className="font-medium">{rotuloMotivoJustificativa[j.motivo]}</p>
                  <p className="text-xs text-muted-foreground">{j.descricao}</p>
                  {j.observacaoDecisao && (
                    <p className="mt-1 text-xs">
                      <span className="text-muted-foreground">Decisão:</span> {j.observacaoDecisao}
                    </p>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <a
                    href={j.anexoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
                  >
                    <PaperclipIcon className="size-3.5" />
                    Ver
                  </a>
                </TableCell>
                <TableCell className="text-center">
                  <StatusJustificativaBadge status={j.status} />
                  {j.decididoEm && (
                    <p className="mt-1 text-xs text-muted-foreground">{formatarData(j.decididoEm.slice(0, 10))}</p>
                  )}
                </TableCell>
                <TableCell>
                  {j.status === StatusJustificativa.PENDENTE && (
                    <div className="flex justify-end gap-1">
                      <BotaoAcao
                        url={`/api/justificativas/${j.id}/decisao`}
                        corpo={{ decisao: "APROVAR" }}
                        variante="default"
                        mensagemSucesso="Justificativa aprovada."
                        confirmacao={{
                          titulo: `Aprovar a justificativa de ${j.aluno.nome}?`,
                          descricao: `A diária de ${formatarData(j.viagem.data)} fica isenta. Confira o anexo antes.`,
                          campoTexto: { nome: "observacao", rotulo: "Observação (opcional)" },
                          rotuloConfirmar: "Aprovar",
                        }}
                      >
                        Aprovar
                      </BotaoAcao>
                      <BotaoAcao
                        url={`/api/justificativas/${j.id}/decisao`}
                        corpo={{ decisao: "RECUSAR" }}
                        mensagemSucesso="Justificativa recusada."
                        confirmacao={{
                          titulo: `Recusar a justificativa de ${j.aluno.nome}?`,
                          descricao: "A diária continua cobrada. O aluno vê a sua observação.",
                          campoTexto: { nome: "observacao", rotulo: "Motivo da recusa", obrigatorio: true },
                          rotuloConfirmar: "Recusar",
                          destrutiva: true,
                        }}
                      >
                        Recusar
                      </BotaoAcao>
                    </div>
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
