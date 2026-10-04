"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { enviarFormulario } from "@/lib/api";
import { formatarData } from "@/lib/datas";
import { ACEITA_ANEXO, erroDoAnexo } from "@/lib/esquemas/arquivo";
import { enviarJustificativaSchema, LIMITES_JUSTIFICATIVA } from "@/lib/esquemas/justificativa";
import { opcoes, rotuloMotivoJustificativa } from "@/lib/rotulos";

const opcoesMotivo = opcoes(rotuloMotivoJustificativa);

export function FormularioJustificativa({
  faltas,
}: {
  faltas: { viagemId: string; data: string; rota: string; avisouAntes: boolean }[];
}) {
  const router = useRouter();
  const campoArquivo = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const form = useFormulario({
    inicial: { viagemId: "", motivo: "", descricao: "" },
    schema: enviarJustificativaSchema,
    paraCorpo: (v) => ({ ...v, motivo: v.motivo || undefined }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const problemaArquivo = erroDoAnexo(arquivo, true);
    setErroArquivo(problemaArquivo);
    if (!form.podeEnviar() || problemaArquivo) {
      toast.error("Revise os campos destacados.");
      return;
    }

    const dados = new FormData();
    dados.set("viagemId", valores.viagemId);
    dados.set("motivo", valores.motivo);
    dados.set("descricao", valores.descricao);
    dados.set("anexo", arquivo!);

    setEnviando(true);
    const resultado = await enviarFormulario("/api/aluno/justificativas", "POST", dados);
    setEnviando(false);
    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      setErroArquivo(resultado.campos.anexo?.[0] ?? null);
      toast.error(resultado.erro);
      return;
    }

    toast.success("Justificativa enviada. A administração vai analisar.");
    atualizar("viagemId", "");
    atualizar("motivo", "");
    atualizar("descricao", "");
    setArquivo(null);
    if (campoArquivo.current) campoArquivo.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("viagemId")}>
            <FieldLabel htmlFor="viagemId" obrigatorio>
              Falta
            </FieldLabel>
            <SelectSimples
              id="viagemId"
              opcoes={faltas.map((f) => ({
                value: f.viagemId,
                label: `${formatarData(f.data)} — ${f.rota}${f.avisouAntes ? " (avisada)" : ""}`,
              }))}
              valor={valores.viagemId}
              aoMudar={(v) => {
                atualizar("viagemId", v);
                tocar("viagemId");
              }}
              placeholder="Escolha o dia"
              invalido={invalido("viagemId")}
              obrigatorio
            />
            <FieldError errors={erroDe("viagemId")} />
          </Field>
          <Field data-invalid={invalido("motivo")}>
            <FieldLabel htmlFor="motivo" obrigatorio>
              Motivo
            </FieldLabel>
            <SelectSimples
              id="motivo"
              opcoes={opcoesMotivo}
              valor={valores.motivo}
              aoMudar={(v) => {
                atualizar("motivo", v);
                tocar("motivo");
              }}
              placeholder="Escolha o motivo"
              invalido={invalido("motivo")}
              obrigatorio
            />
            <FieldError errors={erroDe("motivo")} />
          </Field>
        </div>

        <Field data-invalid={invalido("descricao")}>
          <FieldLabel htmlFor="descricao" obrigatorio>
            Descrição
          </FieldLabel>
          <Textarea
            id="descricao"
            value={valores.descricao}
            onChange={(e) => atualizar("descricao", e.target.value)}
            onBlur={() => tocar("descricao")}
            maxLength={LIMITES_JUSTIFICATIVA.descricaoMax}
            placeholder="Conte o que aconteceu."
            aria-required
            aria-invalid={invalido("descricao")}
          />
          <FieldError errors={erroDe("descricao")} />
        </Field>

        <Field data-invalid={Boolean(erroArquivo)}>
          <FieldLabel htmlFor="anexo" obrigatorio>
            Comprovante
          </FieldLabel>
          <Input
            id="anexo"
            ref={campoArquivo}
            type="file"
            accept={ACEITA_ANEXO}
            onChange={(e) => {
              const novo = e.target.files?.[0] ?? null;
              setArquivo(novo);
              setErroArquivo(erroDoAnexo(novo, true));
            }}
            aria-required
            aria-invalid={Boolean(erroArquivo)}
          />
          <FieldDescription>Atestado, aviso de aula cancelada... PDF, JPG ou PNG, até 5 MB.</FieldDescription>
          <FieldError>{erroArquivo}</FieldError>
        </Field>

        <div>
          <Button type="submit" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar justificativa"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
