"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CampoDinheiro } from "@/components/formulario/campo-dinheiro";
import { SelectSimples } from "@/components/formulario/select-simples";
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
import { enviarFormulario } from "@/lib/api";
import type { CategoriaDespesa } from "@/lib/generated/prisma/enums";
import { decimalParaMascara } from "@/lib/dinheiro";
import { ACEITA_ANEXO, erroDoAnexo } from "@/lib/esquemas/arquivo";
import { atualizarDespesaSchema, criarDespesaSchema, LIMITES_DESPESA } from "@/lib/esquemas/despesa";
import { opcoes, rotuloCategoriaDespesa } from "@/lib/rotulos";

type DespesaInicial = {
  id: string;
  categoria: CategoriaDespesa;
  descricao: string;
  valor: string;
  data: string;
  comprovanteUrl: string | null;
  veiculo: { id: string } | null;
};

const GERAL = "GERAL";
const opcoesCategoria = opcoes(rotuloCategoriaDespesa);

export function FormularioDespesa({
  despesa,
  veiculos,
  hoje,
}: {
  despesa?: DespesaInicial;
  veiculos: { id: string; placa: string; modelo: string }[];
  hoje: string;
}) {
  const router = useRouter();
  const editando = Boolean(despesa);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const form = useFormulario({
    inicial: {
      categoria: despesa?.categoria ?? "",
      descricao: despesa?.descricao ?? "",
      valor: despesa ? decimalParaMascara(despesa.valor) : "",
      data: despesa?.data ?? hoje,
      veiculoId: despesa?.veiculo?.id ?? GERAL,
    },
    schema: editando ? atualizarDespesaSchema : criarDespesaSchema,
    paraCorpo: (v) => ({
      ...v,
      categoria: v.categoria || undefined,
      veiculoId: v.veiculoId === GERAL ? "" : v.veiculoId,
    }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const problema = erroDoAnexo(arquivo, false);
    setErroArquivo(problema);
    if (!form.podeEnviar() || problema) {
      toast.error("Revise os campos destacados.");
      return;
    }

    const dados = new FormData();
    for (const [chave, valor] of Object.entries(form.corpo as Record<string, string | undefined>)) {
      if (valor !== undefined) dados.set(chave, valor);
    }
    if (arquivo) dados.set("comprovante", arquivo);

    setEnviando(true);
    const resultado = despesa
      ? await enviarFormulario(`/api/despesas/${despesa.id}`, "PATCH", dados)
      : await enviarFormulario("/api/despesas", "POST", dados);
    setEnviando(false);
    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      setErroArquivo(resultado.campos.comprovante?.[0] ?? null);
      toast.error(resultado.erro);
      return;
    }
    toast.success(editando ? "Despesa atualizada." : "Despesa lançada.");
    router.push(`/admin/despesas?mes=${valores.data.slice(0, 7)}`);
    router.refresh();
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-xl">
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("categoria")}>
            <FieldLabel htmlFor="categoria" obrigatorio>
              Categoria
            </FieldLabel>
            <SelectSimples
              id="categoria"
              opcoes={opcoesCategoria}
              valor={valores.categoria}
              aoMudar={(v) => {
                atualizar("categoria", v);
                tocar("categoria");
              }}
              placeholder="Escolha a categoria"
              invalido={invalido("categoria")}
              obrigatorio
            />
            <FieldError errors={erroDe("categoria")} />
          </Field>
          <Field data-invalid={invalido("veiculoId")}>
            <FieldLabel htmlFor="veiculoId">Veículo</FieldLabel>
            <SelectSimples
              id="veiculoId"
              opcoes={[
                { value: GERAL, label: "Nenhum (despesa geral)" },
                ...veiculos.map((v) => ({ value: v.id, label: `${v.placa} — ${v.modelo}` })),
              ]}
              valor={valores.veiculoId}
              aoMudar={(v) => atualizar("veiculoId", v)}
            />
            <FieldError errors={erroDe("veiculoId")} />
          </Field>
        </div>

        <Field data-invalid={invalido("descricao")}>
          <FieldLabel htmlFor="descricao" obrigatorio>
            Descrição
          </FieldLabel>
          <Input
            id="descricao"
            value={valores.descricao}
            onChange={(e) => atualizar("descricao", e.target.value)}
            onBlur={() => tocar("descricao")}
            maxLength={LIMITES_DESPESA.descricaoMax}
            placeholder="Diesel — ônibus"
            aria-required
            aria-invalid={invalido("descricao")}
          />
          <FieldDescription>Aparece na página pública: não coloque nome de pessoas.</FieldDescription>
          <FieldError errors={erroDe("descricao")} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("valor")}>
            <FieldLabel htmlFor="valor" obrigatorio>
              Valor
            </FieldLabel>
            <CampoDinheiro
              id="valor"
              valor={valores.valor}
              aoMudar={(v) => atualizar("valor", v)}
              aoSair={() => tocar("valor")}
              invalido={invalido("valor")}
              obrigatorio
            />
            <FieldError errors={erroDe("valor")} />
          </Field>
          <Field data-invalid={invalido("data")}>
            <FieldLabel htmlFor="data" obrigatorio>
              Data
            </FieldLabel>
            <Input
              id="data"
              type="date"
              max={hoje}
              value={valores.data}
              onChange={(e) => atualizar("data", e.target.value)}
              onBlur={() => tocar("data")}
              aria-required
              aria-invalid={invalido("data")}
            />
            <FieldError errors={erroDe("data")} />
          </Field>
        </div>

        <Field data-invalid={Boolean(erroArquivo)}>
          <FieldLabel htmlFor="comprovante">Comprovante</FieldLabel>
          <Input
            id="comprovante"
            type="file"
            accept={ACEITA_ANEXO}
            onChange={(e) => {
              const novo = e.target.files?.[0] ?? null;
              setArquivo(novo);
              setErroArquivo(erroDoAnexo(novo, false));
            }}
            aria-invalid={Boolean(erroArquivo)}
          />
          <FieldDescription>
            {despesa?.comprovanteUrl ? (
              <>
                Já há um{" "}
                <a href={despesa.comprovanteUrl} target="_blank" rel="noreferrer" className="underline">
                  comprovante
                </a>
                . Envie outro só para substituir.
              </>
            ) : (
              "Opcional. PDF, JPG ou PNG, até 5 MB. Não aparece na página pública."
            )}
          </FieldDescription>
          <FieldError>{erroArquivo}</FieldError>
        </Field>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Lançar despesa"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/despesas" />}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
