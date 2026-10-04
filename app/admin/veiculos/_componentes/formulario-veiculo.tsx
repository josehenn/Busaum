"use client";

// Formulário de cadastro e edição.
//
// Validação em duas camadas, com as MESMAS regras (lib/esquemas/veiculo.ts):
// - na tela: ao sair de cada campo e ao enviar; com erro, nada é enviado;
// - no servidor: o service valida de novo (a API pode ser chamada sem a tela) e
//   é o único que sabe o que depende do banco, como placa já cadastrada.
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enviarJson } from "@/lib/api";
import { errosDoSchema, type ErrosPorCampo } from "@/lib/esquemas/erros";
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

type Valores = {
  placa: string;
  tipo: string;
  modelo: string;
  capacidade: string;
  status: string;
};
type Campo = keyof Valores;

const opcoesTipo = opcoes(rotuloTipoVeiculo);
const opcoesStatus = opcoes(rotuloStatusVeiculo);

/** Converte o estado da tela no corpo que a API espera. */
function paraCorpo(valores: Valores, editando: boolean) {
  return {
    placa: valores.placa,
    tipo: valores.tipo || undefined,
    modelo: valores.modelo,
    capacidade: valores.capacidade === "" ? undefined : Number(valores.capacidade),
    ...(editando && { status: valores.status || undefined }),
  };
}

export function FormularioVeiculo({ veiculo }: { veiculo?: VeiculoInicial }) {
  const router = useRouter();
  const editando = Boolean(veiculo);

  const [valores, setValores] = useState<Valores>({
    placa: veiculo?.placa ?? "",
    tipo: veiculo?.tipo ?? "",
    modelo: veiculo?.modelo ?? "",
    capacidade: veiculo ? String(veiculo.capacidade) : "",
    status: veiculo?.status ?? "",
  });
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const [errosServidor, setErrosServidor] = useState<ErrosPorCampo>({});
  const [enviando, setEnviando] = useState(false);

  const corpo = paraCorpo(valores, editando);
  const errosTela = errosDoSchema(editando ? atualizarVeiculoSchema : criarVeiculoSchema, corpo);

  function atualizar(campo: Campo, valor: string) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    // O erro que veio do servidor era sobre o valor antigo.
    setErrosServidor((atuais) => {
      const proximos = { ...atuais };
      delete proximos[campo];
      return proximos;
    });
  }

  function tocar(campo: Campo) {
    setTocados((atuais) => ({ ...atuais, [campo]: true }));
  }

  /** Erro da tela só aparece depois que o usuário passou pelo campo (ou tentou enviar). */
  function erroDe(campo: Campo) {
    const daTela = tentouEnviar || tocados[campo] ? errosTela[campo] : undefined;
    return (daTela ?? errosServidor[campo])?.map((message) => ({ message }));
  }
  const invalido = (campo: Campo) => Boolean(erroDe(campo)?.length);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setTentouEnviar(true);
    if (Object.keys(errosTela).length > 0) {
      toast.error("Revise os campos destacados.");
      return;
    }

    setEnviando(true);
    const resultado = veiculo
      ? await enviarJson(`/api/veiculos/${veiculo.id}`, "PATCH", corpo)
      : await enviarJson("/api/veiculos", "POST", corpo);
    setEnviando(false);

    if (!resultado.ok) {
      setErrosServidor(resultado.campos);
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
            <Select
              items={opcoesTipo}
              value={valores.tipo || null}
              onValueChange={(valor) => {
                atualizar("tipo", valor ?? "");
                tocar("tipo");
              }}
            >
              <SelectTrigger
                id="tipo"
                className="w-full"
                aria-required
                aria-invalid={invalido("tipo")}
              >
                <SelectValue placeholder="Escolha o tipo" />
              </SelectTrigger>
              <SelectContent>
                {opcoesTipo.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <Select
                items={opcoesStatus}
                value={valores.status || null}
                onValueChange={(valor) => {
                  atualizar("status", valor ?? "");
                  tocar("status");
                }}
              >
                <SelectTrigger
                  id="status"
                  className="w-full"
                  aria-required
                  aria-invalid={invalido("status")}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {opcoesStatus.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
