"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CampoDinheiro } from "@/components/formulario/campo-dinheiro";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { enviarJson } from "@/lib/api";
import { decimalParaMascara } from "@/lib/dinheiro";
import { ajustarMensalidadeSchema } from "@/lib/esquemas/mensalidade";

export function FormularioAjuste({
  mensalidadeId,
  ajuste,
  motivo,
}: {
  mensalidadeId: string;
  ajuste: string | null;
  motivo: string | null;
}) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const form = useFormulario({
    inicial: {
      ajuste: ajuste ? `${Number(ajuste) < 0 ? "-" : ""}${decimalParaMascara(Math.abs(Number(ajuste)))}` : "",
      motivo: motivo ?? "",
    },
    schema: ajustarMensalidadeSchema,
    paraCorpo: (v) => v,
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) return;
    setEnviando(true);
    const resultado = await enviarJson(`/api/mensalidades/${mensalidadeId}/ajuste`, "POST", form.corpo);
    setEnviando(false);
    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }
    toast.success(valores.ajuste ? "Ajuste registrado." : "Ajuste removido.");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        <Field data-invalid={invalido("ajuste")}>
          <FieldLabel htmlFor="ajuste">Ajuste</FieldLabel>
          <CampoDinheiro
            id="ajuste"
            valor={valores.ajuste}
            aoMudar={(v) => atualizar("ajuste", v)}
            aoSair={() => tocar("ajuste")}
            invalido={invalido("ajuste")}
            permitirNegativo
          />
          <FieldDescription>Digite &quot;-&quot; para desconto. Vazio remove o ajuste.</FieldDescription>
          <FieldError errors={erroDe("ajuste")} />
        </Field>
        <Field data-invalid={invalido("motivo")}>
          <FieldLabel htmlFor="motivo" obrigatorio={Boolean(valores.ajuste)}>
            Motivo
          </FieldLabel>
          <Textarea
            id="motivo"
            value={valores.motivo}
            onChange={(e) => atualizar("motivo", e.target.value)}
            onBlur={() => tocar("motivo")}
            maxLength={300}
            aria-invalid={invalido("motivo")}
          />
          <FieldError errors={erroDe("motivo")} />
        </Field>
        <div>
          <Button type="submit" variant="outline" disabled={enviando}>
            Salvar ajuste
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
