"use client";

// Formulário de cadastro e edição. A validação na tela usa o mesmo schema do
// service (lib/esquemas/veiculo.ts); placa já cadastrada só o servidor sabe.
import { useState } from "react";
import Link from "next/link";
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
import { enviarJson } from "@/lib/api";
import {
  atualizarVeiculoSchema,
  criarVeiculoSchema,
  LIMITES_VEICULO,
  normalizarPlaca,
} from "@/lib/esquemas/veiculo";
import type { StatusVeiculo, TipoVeiculo } from "@/lib/generated/prisma/enums";
import { opcoes, rotuloStatusVeiculo, rotuloTipoVeiculo } from "@/lib/rotulos";

type VeiculoInicial = {
  id: string;
  placa: string;
  tipo: TipoVeiculo;
  modelo: string;
  capacidade: number;
  status: StatusVeiculo;
};

const opcoesTipo = opcoes(rotuloTipoVeiculo);
const opcoesStatus = opcoes(rotuloStatusVeiculo);

export function FormularioVeiculo({ veiculo }: { veiculo?: VeiculoInicial }) {
  const router = useRouter();
  const editando = Boolean(veiculo);
  const [enviando, setEnviando] = useState(false);

  const form = useFormulario({
    inicial: {
      placa: veiculo?.placa ?? "",
      tipo: veiculo?.tipo ?? "",
      modelo: veiculo?.modelo ?? "",
      capacidade: veiculo ? String(veiculo.capacidade) : "",
      status: veiculo?.status ?? "",
    },
    schema: editando ? atualizarVeiculoSchema : criarVeiculoSchema,
    paraCorpo: (v) => ({
      placa: v.placa,
      tipo: v.tipo || undefined,
      modelo: v.modelo,
      capacidade: v.capacidade === "" ? undefined : Number(v.capacidade),
      ...(editando && { status: v.status || undefined }),
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
    const resultado = veiculo
      ? await enviarJson(`/api/veiculos/${veiculo.id}`, "PATCH", form.corpo)
      : await enviarJson("/api/veiculos", "POST", form.corpo);
    setEnviando(false);

    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }

    toast.success(editando ? "Veículo atualizado." : "Veículo cadastrado.");
    router.push("/admin/veiculos");
    router.refresh();
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-xl">
      <FieldGroup>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("placa")}>
            <FieldLabel htmlFor="placa" obrigatorio>
              Placa
            </FieldLabel>
            <Input
              id="placa"
              value={valores.placa}
              // Sem maxLength: colar "ABC-1D23" (8 caracteres) cortaria o último
              // dígito antes de o hífen ser removido. O limite é aplicado aqui.
              onChange={(e) =>
                atualizar("placa", normalizarPlaca(e.target.value).slice(0, LIMITES_VEICULO.placa))
              }
              onBlur={() => tocar("placa")}
              placeholder="ABC1D23"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
              aria-required
              aria-invalid={invalido("placa")}
            />
            <FieldDescription>Formato antigo (ABC1234) ou Mercosul (ABC1D23).</FieldDescription>
            <FieldError errors={erroDe("placa")} />
          </Field>

          <Field data-invalid={invalido("tipo")}>
            <FieldLabel htmlFor="tipo" obrigatorio>
              Tipo
            </FieldLabel>
            <SelectSimples
              id="tipo"
              opcoes={opcoesTipo}
              valor={valores.tipo}
              aoMudar={(v) => {
                atualizar("tipo", v);
                tocar("tipo");
              }}
              placeholder="Escolha o tipo"
              invalido={invalido("tipo")}
              obrigatorio
            />
            <FieldError errors={erroDe("tipo")} />
          </Field>
        </div>

        <Field data-invalid={invalido("modelo")}>
          <FieldLabel htmlFor="modelo" obrigatorio>
            Modelo
          </FieldLabel>
          <Input
            id="modelo"
            value={valores.modelo}
            onChange={(e) => atualizar("modelo", e.target.value)}
            onBlur={() => tocar("modelo")}
            maxLength={LIMITES_VEICULO.modeloMax}
            placeholder="Marcopolo Torino"
            aria-required
            aria-invalid={invalido("modelo")}
          />
          <FieldError errors={erroDe("modelo")} />
        </Field>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={invalido("capacidade")}>
            <FieldLabel htmlFor="capacidade" obrigatorio>
              Capacidade
            </FieldLabel>
            <Input
              id="capacidade"
              value={valores.capacidade}
              // Só dígitos: type="number" deixaria passar "e", "-" e ",".
              onChange={(e) => atualizar("capacidade", e.target.value.replace(/\D/g, "").slice(0, 3))}
              onBlur={() => tocar("capacidade")}
              inputMode="numeric"
              placeholder="44"
              aria-required
              aria-invalid={invalido("capacidade")}
            />
            <FieldDescription>
              Lugares sentados, de 1 a {LIMITES_VEICULO.capacidadeMax}.
            </FieldDescription>
            <FieldError errors={erroDe("capacidade")} />
          </Field>

          {editando && (
            <Field data-invalid={invalido("status")}>
              <FieldLabel htmlFor="status" obrigatorio>
                Status
              </FieldLabel>
              <SelectSimples
                id="status"
                opcoes={opcoesStatus}
                valor={valores.status}
                aoMudar={(v) => {
                  atualizar("status", v);
                  tocar("status");
                }}
                invalido={invalido("status")}
                obrigatorio
              />
              <FieldError errors={erroDe("status")} />
            </Field>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar veículo"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/veiculos" />}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
