"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CampoDinheiro } from "@/components/formulario/campo-dinheiro";
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
import { decimalParaMascara } from "@/lib/dinheiro";
import { atualizarRotaSchema, criarRotaSchema, LIMITES_ROTA } from "@/lib/esquemas/rota";
import { EditorTrajeto } from "./editor-trajeto";

type RotaInicial = {
  id: string;
  nome: string;
  veiculo: { id: string };
  horarioIda: string;
  horarioVolta: string;
  diasOperacao: number[];
  antecedenciaMinutos: number;
  valorDiaria: string;
  ativa: boolean;
  pontos: { id: string }[];
};

const opcoesStatus = [
  { value: "true", label: "Ativa" },
  { value: "false", label: "Inativa" },
];

/** Listas viram texto ("1,2,3") no estado do formulário, que só guarda strings. */
const lista = (texto: string) => (texto ? texto.split(",") : []);

export function FormularioRota({
  rota,
  veiculos,
  pontos,
}: {
  rota?: RotaInicial;
  veiculos: { id: string; placa: string; modelo: string; capacidade: number }[];
  pontos: { id: string; descricao: string; endereco: string }[];
}) {
  const router = useRouter();
  const editando = Boolean(rota);
  const [enviando, setEnviando] = useState(false);
  const opcoesVeiculo = veiculos.map((v) => ({
    value: v.id,
    label: `${v.placa} — ${v.modelo} (${v.capacidade} lugares)`,
  }));

  const form = useFormulario({
    inicial: {
      nome: rota?.nome ?? "",
      veiculoId: rota?.veiculo.id ?? "",
      horarioIda: rota?.horarioIda ?? "",
      horarioVolta: rota?.horarioVolta ?? "",
      diasOperacao: (rota?.diasOperacao ?? [1, 2, 3, 4, 5]).join(","),
      antecedenciaMinutos: String(rota?.antecedenciaMinutos ?? 60),
      valorDiaria: rota ? decimalParaMascara(rota.valorDiaria) : "",
      ativa: String(rota?.ativa ?? true),
      pontos: (rota?.pontos ?? []).map((p) => p.id).join(","),
    },
    schema: editando ? atualizarRotaSchema : criarRotaSchema,
    paraCorpo: (v) => ({
      nome: v.nome,
      veiculoId: v.veiculoId || undefined,
      horarioIda: v.horarioIda,
      horarioVolta: v.horarioVolta,
      diasOperacao: lista(v.diasOperacao).map(Number),
      antecedenciaMinutos: v.antecedenciaMinutos === "" ? undefined : Number(v.antecedenciaMinutos),
      valorDiaria: v.valorDiaria,
      pontos: lista(v.pontos),
      ...(editando && { ativa: v.ativa === "true" }),
    }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setEnviando(true);
    const resultado = rota
      ? await enviarJson<{ id: string }>(`/api/rotas/${rota.id}`, "PATCH", form.corpo)
      : await enviarJson<{ id: string }>("/api/rotas", "POST", form.corpo);
    setEnviando(false);

    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }
    toast.success(editando ? "Rota atualizada." : "Rota cadastrada.");
    router.push(`/admin/rotas/${resultado.dados.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl">
      <FieldGroup>
        <Field data-invalid={invalido("nome")}>
          <FieldLabel htmlFor="nome" obrigatorio>
            Nome
          </FieldLabel>
          <Input
            id="nome"
            value={valores.nome}
            onChange={(e) => atualizar("nome", e.target.value)}
            onBlur={() => tocar("nome")}
            maxLength={LIMITES_ROTA.nomeMax}
            placeholder="Noturno Capivari → URS"
            aria-required
            aria-invalid={invalido("nome")}
          />
          <FieldError errors={erroDe("nome")} />
        </Field>

        <Field data-invalid={invalido("veiculoId")}>
          <FieldLabel htmlFor="veiculoId" obrigatorio>
            Veículo padrão
          </FieldLabel>
          <SelectSimples
            id="veiculoId"
            opcoes={opcoesVeiculo}
            valor={valores.veiculoId}
            aoMudar={(v) => {
              atualizar("veiculoId", v);
              tocar("veiculoId");
            }}
            placeholder="Escolha o veículo"
            invalido={invalido("veiculoId")}
            obrigatorio
          />
          <FieldDescription>A capacidade dele limita quantos alunos a rota aceita por dia.</FieldDescription>
          <FieldError errors={erroDe("veiculoId")} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-3">
          <Field data-invalid={invalido("horarioIda")}>
            <FieldLabel htmlFor="horarioIda" obrigatorio>
              Saída da ida
            </FieldLabel>
            <Input
              id="horarioIda"
              type="time"
              value={valores.horarioIda}
              onChange={(e) => atualizar("horarioIda", e.target.value)}
              onBlur={() => tocar("horarioIda")}
              aria-required
              aria-invalid={invalido("horarioIda")}
            />
            <FieldError errors={erroDe("horarioIda")} />
          </Field>
          <Field data-invalid={invalido("horarioVolta")}>
            <FieldLabel htmlFor="horarioVolta" obrigatorio>
              Saída da volta
            </FieldLabel>
            <Input
              id="horarioVolta"
              type="time"
              value={valores.horarioVolta}
              onChange={(e) => atualizar("horarioVolta", e.target.value)}
              onBlur={() => tocar("horarioVolta")}
              aria-required
              aria-invalid={invalido("horarioVolta")}
            />
            <FieldError errors={erroDe("horarioVolta")} />
          </Field>
          <Field data-invalid={invalido("antecedenciaMinutos")}>
            <FieldLabel htmlFor="antecedenciaMinutos" obrigatorio>
              Prazo para avisar
            </FieldLabel>
            <div className="relative">
              <Input
                id="antecedenciaMinutos"
                value={valores.antecedenciaMinutos}
                onChange={(e) => atualizar("antecedenciaMinutos", e.target.value.replace(/\D/g, "").slice(0, 4))}
                onBlur={() => tocar("antecedenciaMinutos")}
                inputMode="numeric"
                className="pr-12"
                aria-required
                aria-invalid={invalido("antecedenciaMinutos")}
              />
              <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-muted-foreground">
                min
              </span>
            </div>
            <FieldDescription>Antes da saída da ida.</FieldDescription>
            <FieldError errors={erroDe("antecedenciaMinutos")} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-[1fr_12rem]">
          <Field data-invalid={invalido("diasOperacao")}>
            <FieldLabel htmlFor="diasOperacao" obrigatorio>
              Dias de operação
            </FieldLabel>
            <SeletorDias
              id="diasOperacao"
              valor={lista(valores.diasOperacao).map(Number)}
              aoMudar={(dias) => {
                atualizar("diasOperacao", dias.join(","));
                tocar("diasOperacao");
              }}
              invalido={invalido("diasOperacao")}
            />
            <FieldError errors={erroDe("diasOperacao")} />
          </Field>
          <Field data-invalid={invalido("valorDiaria")}>
            <FieldLabel htmlFor="valorDiaria" obrigatorio>
              Valor da diária
            </FieldLabel>
            <CampoDinheiro
              id="valorDiaria"
              valor={valores.valorDiaria}
              aoMudar={(v) => atualizar("valorDiaria", v)}
              aoSair={() => tocar("valorDiaria")}
              invalido={invalido("valorDiaria")}
              obrigatorio
            />
            <FieldDescription>Ida e volta.</FieldDescription>
            <FieldError errors={erroDe("valorDiaria")} />
          </Field>
        </div>

        <Field data-invalid={invalido("pontos")}>
          <FieldLabel htmlFor="pontos" obrigatorio>
            Trajeto da ida
          </FieldLabel>
          <FieldDescription>Na ordem em que o veículo passa. A volta faz o caminho inverso.</FieldDescription>
          <EditorTrajeto
            id="pontos"
            pontos={pontos}
            valor={lista(valores.pontos)}
            aoMudar={(ids) => {
              atualizar("pontos", ids.join(","));
              tocar("pontos");
            }}
            invalido={invalido("pontos")}
          />
          <FieldError errors={erroDe("pontos")} />
        </Field>

        {editando && (
          <Field data-invalid={invalido("ativa")}>
            <FieldLabel htmlFor="ativa" obrigatorio>
              Status
            </FieldLabel>
            <SelectSimples
              id="ativa"
              opcoes={opcoesStatus}
              valor={valores.ativa}
              aoMudar={(v) => atualizar("ativa", v)}
              invalido={invalido("ativa")}
              obrigatorio
            />
            <FieldError errors={erroDe("ativa")} />
          </Field>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar rota"}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={rota ? `/admin/rotas/${rota.id}` : "/admin/rotas"} />}
          >
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
