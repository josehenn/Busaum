import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckIcon, MinusIcon, TriangleAlertIcon } from "lucide-react";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusVeiculo, StatusViagem } from "@/lib/generated/prisma/enums";
import { formatarData, formatarDataHora } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { ErroNaoEncontrado } from "@/server/comum/erros";
import { veiculoService } from "@/server/veiculos";
import { viagemService } from "@/server/viagens";
import { StatusViagemBadge } from "../_componentes/status-viagem";
import { TrocarVeiculo } from "../_componentes/trocar-veiculo";

export const metadata: Metadata = { title: "Viagem" };

function Marca({ sim }: { sim: boolean }) {
  return sim ? (
    <CheckIcon className="mx-auto size-4" aria-label="Sim" />
  ) : (
    <MinusIcon className="mx-auto size-4 text-muted-foreground" aria-label="Não" />
  );
}

export default async function DetalheViagem({ params }: PageProps<"/admin/viagens/[id]">) {
  const { id } = await params;
  let viagem: Awaited<ReturnType<typeof viagemService.detalhar>>;
  try {
    viagem = await viagemService.detalhar(id);
  } catch (erro) {
    if (erro instanceof ErroNaoEncontrado) notFound();
    throw erro;
  }
  const agendada = viagem.status === StatusViagem.AGENDADA;
  const veiculos = agendada
    ? (await veiculoService.listar()).filter((v) => v.status === StatusVeiculo.ATIVO)
    : [];

  return (
    <>
      <CabecalhoPagina
        titulo={viagem.rota.nome}
        descricao={`${formatarData(viagem.data)} · ida ${viagem.horarioIda} · volta ${viagem.horarioVolta} · avisos até ${formatarDataHora(viagem.prazoDeclaracao)}`}
        acoes={
          <>
            <StatusViagemBadge status={viagem.status} />
            {agendada && (
              <BotaoAcao
                url={`/api/viagens/${id}/cancelar`}
                variante="destructive"
                tamanho="default"
                mensagemSucesso="Viagem cancelada."
                confirmacao={{
                  titulo: "Cancelar a viagem inteira?",
                  descricao:
                    "Use para o que atinge todos: quebra, feriado, greve. A diária do dia fica isenta para todos os alunos. Aula cancelada de um aluno é justificativa, não cancelamento.",
                  campoTexto: { nome: "motivo", rotulo: "Motivo", obrigatorio: true, max: 200 },
                  rotuloConfirmar: "Cancelar viagem",
                  destrutiva: true,
                }}
              >
                Cancelar viagem
              </BotaoAcao>
            )}
          </>
        }
      />

      {viagem.motivoCancelamento && (
        <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          Cancelada: {viagem.motivoCancelamento}
        </p>
      )}
      {viagem.acimaDaCapacidade && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <TriangleAlertIcon className="size-4 text-destructive" />
          Há mais alunos esperados ({Math.max(viagem.ida, viagem.volta)}) que lugares no veículo do dia (
          {viagem.capacidade}). Troque o veículo ou confirme quem vai.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Passageiros</CardTitle>
              <CardDescription>
                {viagem.ida} na ida e {viagem.volta} na volta, de {viagem.capacidade} lugares.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead className="text-center">Ida</TableHead>
                      <TableHead className="text-center">Volta</TableHead>
                      <TableHead>Sobe → desce (ida)</TableHead>
                      <TableHead>Desce na volta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viagem.passageiros.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          Ninguém esperado nesta viagem.
                        </TableCell>
                      </TableRow>
                    )}
                    {viagem.passageiros.map((p) => (
                      <TableRow key={p.alunoId}>
                        <TableCell className="font-medium">
                          {p.nome}
                          {p.origem === "AVULSO" && (
                            <Badge variant="secondary" className="ml-2">
                              Avulso
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Marca sim={p.vaiIda} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Marca sim={p.vaiVolta} />
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.embarque} → {p.destino}
                        </TableCell>
                        <TableCell className="text-xs">{p.retorno}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {viagem.ausentesLista.length > 0 && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Avisaram que não vão: {viagem.ausentesLista.map((a) => a.nome).join(", ")}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paradas</CardTitle>
              <CardDescription>Riscadas: ninguém sobe nem desce — dá para passar direto.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {viagem.pontos.map((p) => (
                  <li key={p.id} className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                      {p.ordem}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn(p.pularIda && p.pularVolta && "text-muted-foreground line-through")}>
                        {p.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className={cn(p.pularIda && "line-through")}>
                          Ida: ↑{p.sobeIda} ↓{p.desceIda}
                        </span>
                        {" · "}
                        <span className={cn(p.pularVolta && "line-through")}>
                          Volta: ↑{p.sobeVolta} ↓{p.desceVolta}
                        </span>
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Veículo do dia</CardTitle>
              <CardDescription>
                {viagem.veiculo.placa} · {viagem.veiculo.modelo} · {viagem.capacidade} lugares
              </CardDescription>
            </CardHeader>
            {agendada && (
              <CardContent>
                <TrocarVeiculo viagemId={id} atual={viagem.veiculo.id} veiculos={veiculos} />
              </CardContent>
            )}
          </Card>

          <Link href={`/admin/viagens?dia=${viagem.data}`} className="block text-sm text-muted-foreground hover:underline">
            ← Viagens de {formatarData(viagem.data)}
          </Link>
        </div>
      </div>
    </>
  );
}
