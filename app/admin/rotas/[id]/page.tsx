import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon, PlusIcon, RepeatIcon } from "lucide-react";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { StatusAtivoBadge } from "@/components/status-ativo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { descreverDias, formatarData, nomeDiaCurto } from "@/lib/datas";
import { formatarReais } from "@/lib/dinheiro";
import { cn } from "@/lib/utils";
import { planoService } from "@/server/planos";
import { rotaService } from "@/server/rotas";
import { carregarRota } from "./carregar-rota";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { exigirPerfil } from "@/server/sessao/sessao.service";

export const metadata: Metadata = { title: "Rota" };

export default async function DetalheRota({ params }: PageProps<"/admin/rotas/[id]">) {
  await exigirPerfil(PerfilUsuario.ADMIN);
  const { id } = await params;
  const rota = await carregarRota(id);
  const [planos, ocupacao] = await Promise.all([planoService.listarDaRota(id), rotaService.ocupacao(id)]);

  return (
    <>
      <CabecalhoPagina
        titulo={rota.nome}
        descricao={`${rota.veiculo.placa} · ${rota.veiculo.modelo} · ${rota.veiculo.capacidade} lugares`}
        acoes={
          <>
            <StatusAtivoBadge ativo={rota.ativa} rotulos={["Ativa", "Inativa"]} />
            <Button variant="outline" nativeButton={false} render={<Link href={`/admin/rotas/${id}/editar`} />}>
              <PencilIcon />
              Editar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ocupação por dia</CardTitle>
              <CardDescription>
                Alunos com plano em cada dia. A contratação é recusada no dia que chega a {ocupacao.capacidade}.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {rota.diasOperacao.map((d) => {
                const ocupados = ocupacao.porDia[d] ?? 0;
                const lotado = ocupados >= ocupacao.capacidade;
                return (
                  <div
                    key={d}
                    className={cn(
                      "min-w-16 rounded-lg border px-3 py-2 text-center",
                      lotado && "border-destructive bg-destructive/5",
                    )}
                  >
                    <p className="text-xs text-muted-foreground">{nomeDiaCurto[d]}</p>
                    <p className="font-medium tabular-nums">
                      {ocupados}/{ocupacao.capacidade}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alunos contratados</CardTitle>
              <CardDescription>Planos em vigor. Trocar um plano encerra o atual e abre outro a partir de agora.</CardDescription>
            </CardHeader>
            <CardContent>
              {rota.ativa && (
                <div className="mb-3 flex justify-end">
                  <Button size="sm" nativeButton={false} render={<Link href={`/admin/rotas/${id}/planos/novo`} />}>
                    <PlusIcon />
                    Contratar aluno
                  </Button>
                </div>
              )}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Ida</TableHead>
                      <TableHead>Volta</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead className="text-center">Desde</TableHead>
                      <TableHead className="w-40">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {planos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                          Nenhum aluno contratado nesta rota.
                        </TableCell>
                      </TableRow>
                    )}
                    {planos.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                        <TableCell className="text-xs">
                          {p.pontoEmbarque.descricao} → {p.pontoDestino.descricao}
                        </TableCell>
                        <TableCell className="text-xs">
                          {p.pontoDestino.descricao} → {p.pontoRetorno.descricao}
                        </TableCell>
                        <TableCell>{descreverDias(p.diasSemana)}</TableCell>
                        <TableCell className="text-center tabular-nums">{formatarData(p.vigenteDe)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              nativeButton={false}
                              render={<Link href={`/admin/rotas/${id}/planos/novo?aluno=${p.aluno.id}`} />}
                            >
                              <RepeatIcon />
                              Trocar
                            </Button>
                            <BotaoAcao
                              url={`/api/planos/${p.id}/encerrar`}
                              variante="ghost"
                              mensagemSucesso="Plano encerrado."
                              confirmacao={{
                                titulo: `Encerrar o plano de ${p.aluno.nome}?`,
                                descricao:
                                  "O aluno deixa de ser esperado nas próximas viagens desta rota. Os dias que já passaram continuam na cobrança do mês.",
                                rotuloConfirmar: "Encerrar plano",
                                destrutiva: true,
                              }}
                            >
                              Encerrar
                            </BotaoAcao>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operação</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Ida</dt>
                <dd className="tabular-nums">{rota.horarioIda}</dd>
                <dt className="text-muted-foreground">Volta</dt>
                <dd className="tabular-nums">{rota.horarioVolta}</dd>
                <dt className="text-muted-foreground">Dias</dt>
                <dd>{descreverDias(rota.diasOperacao)}</dd>
                <dt className="text-muted-foreground">Diária</dt>
                <dd className="tabular-nums">{formatarReais(rota.valorDiaria)}</dd>
                <dt className="text-muted-foreground">Avisar até</dt>
                <dd>{rota.antecedenciaMinutos} min antes da ida</dd>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trajeto da ida</CardTitle>
              <CardDescription>A volta faz o caminho inverso.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2">
                {rota.pontos.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 text-sm">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
                      {p.ordem}
                    </span>
                    {p.descricao}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
