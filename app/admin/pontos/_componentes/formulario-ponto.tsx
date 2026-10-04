"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { SelectComCadastro } from "@/components/formulario/select-com-cadastro";
import { SelectSimples } from "@/components/formulario/select-simples";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";
import {
  atualizarPontoSchema,
  criarPontoSchema,
  LIMITES_PONTO,
  UFS,
} from "@/lib/esquemas/ponto";
import { LIMITES_INSTITUICAO } from "@/lib/esquemas/instituicao";
import { apenasDigitos } from "@/lib/mascaras";

type PontoInicial = {
  id: string;
  descricao: string;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  referencia: string | null;
  latitude: string | null;
  longitude: string | null;
  ativo: boolean;
  instituicao: { id: string } | null;
};

const NENHUMA = "NENHUMA";

type Instituicao = { id: string; nome: string; sigla: string | null };
const rotuloInstituicao = (i: Instituicao) => (i.sigla ? `${i.sigla} — ${i.nome}` : i.nome);
const opcoesUf = UFS.map((uf) => ({ value: uf, label: uf }));
const opcoesStatus = [
  { value: "true", label: "Ativo" },
  { value: "false", label: "Inativo" },
];

function formatarCep(valor: string) {
  const d = apenasDigitos(valor).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function FormularioPonto({
  ponto,
  instituicoes,
}: {
  ponto?: PontoInicial;
  instituicoes: Instituicao[];
}) {
  const router = useRouter();
  const editando = Boolean(ponto);
  const [enviando, setEnviando] = useState(false);
  const opcoesInstituicao = [
    { value: NENHUMA, label: "Nenhuma (ponto comum)" },
    ...instituicoes.map((i) => ({ value: i.id, label: rotuloInstituicao(i) })),
  ];

  const form = useFormulario({
    inicial: {
      descricao: ponto?.descricao ?? "",
      logradouro: ponto?.logradouro ?? "",
      numero: ponto?.numero ?? "",
      complemento: ponto?.complemento ?? "",
      bairro: ponto?.bairro ?? "",
      cidade: ponto?.cidade ?? "",
      uf: ponto?.uf ?? "",
      cep: ponto?.cep ? formatarCep(ponto.cep) : "",
      referencia: ponto?.referencia ?? "",
      instituicaoId: ponto?.instituicao?.id ?? NENHUMA,
      latitude: ponto?.latitude ?? "",
      longitude: ponto?.longitude ?? "",
      ativo: ponto ? String(ponto.ativo) : "true",
    },
    schema: editando ? atualizarPontoSchema : criarPontoSchema,
    paraCorpo: ({ instituicaoId, ativo, ...v }) => ({
      ...v,
      instituicaoId: instituicaoId === NENHUMA ? "" : instituicaoId,
      ...(editando && { ativo: ativo === "true" }),
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
    const resultado = ponto
      ? await enviarJson(`/api/pontos/${ponto.id}`, "PATCH", form.corpo)
      : await enviarJson("/api/pontos", "POST", form.corpo);
    setEnviando(false);

    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }
    toast.success(editando ? "Ponto atualizado." : "Ponto cadastrado.");
    router.push("/admin/pontos");
    router.refresh();
  }

  type CampoTexto =
    | "descricao" | "logradouro" | "numero" | "complemento" | "bairro" | "cidade"
    | "referencia" | "latitude" | "longitude";

  /** Campo de texto simples: rótulo, input e erro. Chamado como função (não como
   * <Componente/>) para o input não ser recriado — e perder o foco — a cada tecla. */
  function campoTexto({
    campo,
    rotulo,
    max,
    obrigatorio,
    placeholder,
    descricao,
  }: {
    campo: CampoTexto;
    rotulo: string;
    max?: number;
    obrigatorio?: boolean;
    placeholder?: string;
    descricao?: string;
  }) {
    return (
      <Field data-invalid={invalido(campo)}>
        <FieldLabel htmlFor={campo} obrigatorio={obrigatorio}>
          {rotulo}
        </FieldLabel>
        <Input
          id={campo}
          value={valores[campo]}
          onChange={(e) => atualizar(campo, e.target.value)}
          onBlur={() => tocar(campo)}
          maxLength={max}
          placeholder={placeholder}
          aria-required={obrigatorio}
          aria-invalid={invalido(campo)}
        />
        {descricao && <FieldDescription>{descricao}</FieldDescription>}
        <FieldError errors={erroDe(campo)} />
      </Field>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl">
      <FieldGroup>
        {campoTexto({
          campo: "descricao",
          rotulo: "Descrição",
          max: LIMITES_PONTO.descricaoMax,
          obrigatorio: true,
          placeholder: "Praça da Matriz",
          descricao: "Como motoristas e alunos conhecem o lugar.",
        })}

        <Field data-invalid={invalido("instituicaoId")}>
          <FieldLabel htmlFor="instituicaoId">Campus de</FieldLabel>
          <SelectComCadastro<Instituicao>
            id="instituicaoId"
            opcoes={opcoesInstituicao}
            valor={valores.instituicaoId}
            aoMudar={(v) => atualizar("instituicaoId", v)}
            cadastro={{
              titulo: "Nova instituição",
              descricao: "Não está na lista? Cadastre pelo nome e ela já fica selecionada.",
              rotulo: "Nome da instituição",
              url: "/api/instituicoes",
              max: LIMITES_INSTITUICAO.nomeMax,
              paraOpcao: (i) => ({ value: i.id, label: rotuloInstituicao(i) }),
            }}
          />
          <FieldDescription>Preencha se o ponto é a entrada de uma instituição.</FieldDescription>
          <FieldError errors={erroDe("instituicaoId")} />
        </Field>

        {editando && (
          <Field data-invalid={invalido("ativo")}>
            <FieldLabel htmlFor="ativo" obrigatorio>
              Status
            </FieldLabel>
            <SelectSimples
              id="ativo"
              opcoes={opcoesStatus}
              valor={valores.ativo}
              aoMudar={(v) => atualizar("ativo", v)}
              invalido={invalido("ativo")}
              obrigatorio
            />
            <FieldError errors={erroDe("ativo")} />
          </Field>
        )}

        <FieldSet>
          <FieldLegend>Endereço</FieldLegend>
          <FieldDescription>Opcional. Preencha o que souber.</FieldDescription>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-[1fr_8rem]">
              {campoTexto({ campo: "logradouro", rotulo: "Logradouro", max: LIMITES_PONTO.logradouroMax })}
              {campoTexto({ campo: "numero", rotulo: "Número", max: LIMITES_PONTO.numeroMax })}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {campoTexto({ campo: "complemento", rotulo: "Complemento", max: LIMITES_PONTO.complementoMax })}
              {campoTexto({ campo: "bairro", rotulo: "Bairro", max: LIMITES_PONTO.bairroMax })}
            </div>
            <div className="grid gap-6 sm:grid-cols-[1fr_6rem_9rem]">
              {campoTexto({ campo: "cidade", rotulo: "Cidade", max: LIMITES_PONTO.cidadeMax })}
              <Field data-invalid={invalido("uf")}>
                <FieldLabel htmlFor="uf">UF</FieldLabel>
                <SelectSimples
                  id="uf"
                  opcoes={opcoesUf}
                  valor={valores.uf}
                  aoMudar={(v) => atualizar("uf", v)}
                  placeholder="—"
                  invalido={invalido("uf")}
                />
                <FieldError errors={erroDe("uf")} />
              </Field>
              <Field data-invalid={invalido("cep")}>
                <FieldLabel htmlFor="cep">CEP</FieldLabel>
                <Input
                  id="cep"
                  value={valores.cep}
                  onChange={(e) => atualizar("cep", formatarCep(e.target.value))}
                  onBlur={() => tocar("cep")}
                  inputMode="numeric"
                  placeholder="00000-000"
                  aria-invalid={invalido("cep")}
                />
                <FieldError errors={erroDe("cep")} />
              </Field>
            </div>
            {campoTexto({
              campo: "referencia",
              rotulo: "Referência",
              max: LIMITES_PONTO.referenciaMax,
              placeholder: "Em frente à igreja",
            })}
            <div className="grid gap-6 sm:grid-cols-2">
              {campoTexto({ campo: "latitude", rotulo: "Latitude", placeholder: "-28.4813" })}
              {campoTexto({ campo: "longitude", rotulo: "Longitude", placeholder: "-49.0071" })}
            </div>
          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar ponto"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/pontos" />}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
