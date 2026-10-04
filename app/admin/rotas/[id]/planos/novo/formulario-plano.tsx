"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectSimples } from "@/components/formulario/select-simples";
import { SeletorDias } from "@/components/formulario/seletor-dias";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";
import { contratarPlanoSchema } from "@/lib/esquemas/rota";

type Rota = {
  id: string;
  diasOperacao: number[];
  pontos: { id: string; ordem: number; descricao: string; instituicaoId: string | null }[];
};
type PlanoAtual = {
  aluno: { id: string; nome: string };
  pontoEmbarque: { id: string };
  pontoDestino: { id: string };
  pontoRetorno: { id: string };
  retornoNoEmbarque: boolean;
  diasSemana: number[];
};

const MESMO_DO_EMBARQUE = "MESMO";

export function FormularioPlano({
  rota,
  ocupacao,
  alunos,
  planoAtual,
}: {
  rota: Rota;
  ocupacao: { capacidade: number; porDia: Record<number, number> };
  alunos: { id: string; nome: string; instituicaoId: string }[];
  planoAtual: PlanoAtual | null;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const opcoesPonto = rota.pontos.map((p) => ({ value: p.id, label: `${p.ordem}. ${p.descricao}` }));

  const form = useFormulario({
    inicial: {
      alunoId: planoAtual?.aluno.id ?? "",
      pontoEmbarqueId: planoAtual?.pontoEmbarque.id ?? "",
      pontoDestinoId: planoAtual?.pontoDestino.id ?? "",
      pontoRetornoId:
        planoAtual && !planoAtual.retornoNoEmbarque ? planoAtual.pontoRetorno.id : MESMO_DO_EMBARQUE,
      diasSemana: (planoAtual?.diasSemana ?? []).join(","),
    },
    schema: contratarPlanoSchema,
    paraCorpo: (v) => ({
      alunoId: v.alunoId,
      rotaId: rota.id,
      pontoEmbarqueId: v.pontoEmbarqueId,
      pontoDestinoId: v.pontoDestinoId,
      pontoRetornoId: v.pontoRetornoId === MESMO_DO_EMBARQUE ? "" : v.pontoRetornoId,
      diasSemana: v.diasSemana ? v.diasSemana.split(",").map(Number) : [],
    }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  // Na troca, os dias do plano atual do aluno não contam contra ele mesmo.
  const ocupadosSemOAluno = (d: number) =>
    (ocupacao.porDia[d] ?? 0) - (planoAtual?.diasSemana.includes(d) ? 1 : 0);
  const detalhes = Object.fromEntries(
    rota.diasOperacao.map((d) => [d, `${ocupadosSemOAluno(d)}/${ocupacao.capacidade}`]),
  );
  const lotados = rota.diasOperacao.filter((d) => ocupadosSemOAluno(d) >= ocupacao.capacidade);

  /**
   * Sugestão de destino: o ponto da rota que é campus da instituição do aluno.
   * Só preenche se o destino ainda está vazio — o admin pode trocar à vontade
   * (estágio, outro campus...).
   */
  function escolherAluno(alunoId: string) {
    atualizar("alunoId", alunoId);
    tocar("alunoId");
    const aluno = alunos.find((a) => a.id === alunoId);
    const campus = rota.pontos.find((p) => p.instituicaoId && p.instituicaoId === aluno?.instituicaoId);
    if (campus && !valores.pontoDestinoId) atualizar("pontoDestinoId", campus.id);
  }

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setEnviando(true);
    const resultado = await enviarJson("/api/planos", "POST", form.corpo);
    setEnviando(false);

    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }
    toast.success(planoAtual ? "Plano trocado." : "Aluno contratado.");
    router.push(`/admin/rotas/${rota.id}`);
    router.refresh();
  }

  const destinoSugerido = (() => {
    const aluno = alunos.find((a) => a.id === valores.alunoId);
    const campus = rota.pontos.find((p) => p.instituicaoId && p.instituicaoId === aluno?.instituicaoId);
    return campus && campus.id === valores.pontoDestinoId;
  })();

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl">
      <FieldGroup>
        <Field data-invalid={invalido("alunoId")}>
          <FieldLabel htmlFor="alunoId" obrigatorio>
            Aluno
          </FieldLabel>
          {planoAtual ? (
            <Input id="alunoId" value={planoAtual.aluno.nome} disabled />
          ) : (
            <SelectSimples
              id="alunoId"
              opcoes={alunos.map((a) => ({ value: a.id, label: a.nome }))}
              valor={valores.alunoId}
              aoMudar={escolherAluno}
              placeholder="Escolha o aluno"
              invalido={invalido("alunoId")}
              obrigatorio
            />
          )}
          <FieldError errors={erroDe("alunoId")} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("pontoEmbarqueId")}>
            <FieldLabel htmlFor="pontoEmbarqueId" obrigatorio>
              Sobe em (ida)
            </FieldLabel>
            <SelectSimples
              id="pontoEmbarqueId"
              opcoes={opcoesPonto}
              valor={valores.pontoEmbarqueId}
              aoMudar={(v) => {
                atualizar("pontoEmbarqueId", v);
                tocar("pontoEmbarqueId");
              }}
              placeholder="Escolha o ponto"
              invalido={invalido("pontoEmbarqueId")}
              obrigatorio
            />
            <FieldError errors={erroDe("pontoEmbarqueId")} />
          </Field>

          <Field data-invalid={invalido("pontoDestinoId")}>
            <FieldLabel htmlFor="pontoDestinoId" obrigatorio>
              Desce em (destino)
            </FieldLabel>
            <SelectSimples
              id="pontoDestinoId"
              opcoes={opcoesPonto}
              valor={valores.pontoDestinoId}
              aoMudar={(v) => {
                atualizar("pontoDestinoId", v);
                tocar("pontoDestinoId");
              }}
              placeholder="Escolha o ponto"
              invalido={invalido("pontoDestinoId")}
              obrigatorio
            />
            {destinoSugerido && !invalido("pontoDestinoId") && (
              <FieldDescription>Sugerido: campus da instituição do aluno.</FieldDescription>
            )}
            <FieldError errors={erroDe("pontoDestinoId")} />
          </Field>
        </div>

        <Field data-invalid={invalido("pontoRetornoId")}>
          <FieldLabel htmlFor="pontoRetornoId">Desce na volta</FieldLabel>
          <SelectSimples
            id="pontoRetornoId"
            opcoes={[{ value: MESMO_DO_EMBARQUE, label: "No mesmo ponto onde subiu" }, ...opcoesPonto]}
            valor={valores.pontoRetornoId}
            aoMudar={(v) => {
              atualizar("pontoRetornoId", v);
              tocar("pontoRetornoId");
            }}
            invalido={invalido("pontoRetornoId")}
          />
          <FieldDescription>Na volta o aluno sobe no destino. Mude só se ele desce em outro lugar.</FieldDescription>
          <FieldError errors={erroDe("pontoRetornoId")} />
        </Field>

        <Field data-invalid={invalido("diasSemana")}>
          <FieldLabel htmlFor="diasSemana" obrigatorio>
            Dias contratados
          </FieldLabel>
          <SeletorDias
            id="diasSemana"
            valor={valores.diasSemana ? valores.diasSemana.split(",").map(Number) : []}
            aoMudar={(dias) => {
              atualizar("diasSemana", dias.join(","));
              tocar("diasSemana");
            }}
            permitidos={rota.diasOperacao}
            bloqueados={lotados}
            detalhes={detalhes}
            invalido={invalido("diasSemana")}
          />
          <FieldDescription>
            Ocupação de cada dia, sem contar este aluno. Dias lotados ficam desabilitados.
          </FieldDescription>
          <FieldError errors={erroDe("diasSemana")} />
        </Field>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : planoAtual ? "Trocar plano" : "Contratar"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href={`/admin/rotas/${rota.id}`} />}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
