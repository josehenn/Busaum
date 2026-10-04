import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { dataDeIso, descreverDias, diaSemanaIso, formatarData, formatarDataHora, nomeDiaLongo } from "@/lib/datas";
import { declaracaoService, type SituacaoNaViagem } from "@/server/declaracoes";
import { planoService } from "@/server/planos";
import { exigirPerfil } from "@/server/sessao/sessao.service";
import { AcoesViagem } from "./acoes-viagem";

export const metadata: Metadata = { title: "Minhas viagens" };

const textoSituacao: Record<SituacaoNaViagem, { texto: string; variante: "default" | "secondary" | "outline" | "destructive" }> = {
  VAI: { texto: "Você vai", variante: "default" },
  SO_IDA: { texto: "Só a ida", variante: "secondary" },
  SO_VOLTA: { texto: "Só a volta", variante: "secondary" },
  AUSENTE: { texto: "Ausência avisada", variante: "outline" },
  NAO_CONTRATADO: { texto: "Dia não contratado", variante: "outline" },
  AVULSO: { texto: "Avulso — diária extra", variante: "secondary" },
  CANCELADA: { texto: "Viagem cancelada", variante: "destructive" },
};

export default async function MinhasViagens() {
  const usuario = await exigirPerfil(PerfilUsuario.ALUNO);
  const alunoId = usuario.alunoId!;
  const [planos, viagens] = await Promise.all([
    planoService.listarDoAluno(alunoId),
    declaracaoService.listarProximas(alunoId),
  ]);

  // Agrupa por dia, mantendo a ordem cronológica.
  const porDia = new Map<string, typeof viagens>();
  for (const v of viagens) porDia.set(v.data, [...(porDia.get(v.data) ?? []), v]);

  return (
    <>
      <CabecalhoPagina
        titulo="Minhas viagens"
        descricao="Nos dias contratados você já está na lista. Avise só quando não for — ou quando quiser ir num dia extra."
      />

      {planos.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Você ainda não tem transporte contratado. Fale com a administração.
        </p>
      ) : (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {planos.map((p) => (
            <Card key={p.id} size="sm">
              <CardHeader>
                <CardTitle>{p.rota.nome}</CardTitle>
                <CardDescription>
                  {descreverDias(p.diasSemana)} · sobe em {p.pontoEmbarque.descricao}, desce em {p.pontoDestino.descricao}
                  {!p.retornoNoEmbarque && ` · na volta desce em ${p.pontoRetorno.descricao}`}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {[...porDia.entries()].map(([dia, lista]) => (
          <section key={dia} className="space-y-2">
            <h2 className="text-sm font-medium capitalize text-muted-foreground">
              {nomeDiaLongo[diaSemanaIso(dataDeIso(dia))]}, {formatarData(dia)}
            </h2>
            {lista.map((v) => (
              <Card key={v.id} size="sm">
                <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3">
                  <div className="min-w-48 flex-1">
                    <p className="font-medium">{v.rota.nome}</p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      Ida {v.horarioIda} · Volta {v.horarioVolta}
                    </p>
                  </div>
                  <Badge variant={textoSituacao[v.situacao].variante}>{textoSituacao[v.situacao].texto}</Badge>
                  {v.situacao === "CANCELADA" ? (
                    <p className="text-sm text-muted-foreground">{v.motivoCancelamento}</p>
                  ) : v.prazoAberto ? (
                    <div className="space-y-1">
                      <AcoesViagem
                        viagemId={v.id}
                        contratado={v.contratado}
                        usaIda={v.usaIda}
                        usaVolta={v.usaVolta}
                        vagas={v.vagas}
                      />
                      <p className="text-xs text-muted-foreground">
                        Avise até {formatarDataHora(v.prazoDeclaracao)}
                        {!v.contratado && ` · ${v.vagas} lugar(es) livre(s)`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Prazo para avisar encerrado.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
