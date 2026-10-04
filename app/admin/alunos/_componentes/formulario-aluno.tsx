"use client";

// Cadastro e edição de aluno. Mesmas regras do service (lib/esquemas/aluno.ts);
// e-mail, CPF e matrícula repetidos só o servidor sabe.
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
  FieldLegend,
  FieldSet,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";
import { atualizarAlunoSchema, criarAlunoSchema, LIMITES_ALUNO } from "@/lib/esquemas/aluno";
import { LIMITES_INSTITUICAO } from "@/lib/esquemas/instituicao";
import { StatusAluno, type Turno } from "@/lib/generated/prisma/enums";
import { formatarCpf, formatarTelefone } from "@/lib/mascaras";
import { opcoes, rotuloStatusAluno, rotuloTurno } from "@/lib/rotulos";

type Instituicao = { id: string; nome: string; sigla: string | null };

const rotuloInstituicao = (i: Instituicao) => (i.sigla ? `${i.sigla} — ${i.nome}` : i.nome);

type AlunoInicial = {
  id: string;
  nome: string;
  email: string;
  cpfMascarado: string;
  telefone: string;
  instituicao: { id: string };
  matricula: string | null;
  curso: string;
  turno: Turno;
  status: StatusAluno;
  inicioEm: string;
};

const opcoesTurno = opcoes(rotuloTurno);
const opcoesStatus = opcoes(rotuloStatusAluno);

export function FormularioAluno({
  aluno,
  instituicoes,
  hoje,
}: {
  aluno?: AlunoInicial;
  instituicoes: Instituicao[];
  /** "AAAA-MM-DD" de hoje em Brasília, calculado no servidor. */
  hoje: string;
}) {
  const router = useRouter();
  const editando = Boolean(aluno);
  const [enviando, setEnviando] = useState(false);
  const opcoesInstituicao = instituicoes.map((i) => ({ value: i.id, label: rotuloInstituicao(i) }));

  const form = useFormulario({
    inicial: {
      nome: aluno?.nome ?? "",
      email: aluno?.email ?? "",
      cpf: "",
      telefone: aluno ? formatarTelefone(aluno.telefone) : "",
      instituicaoId: aluno?.instituicao.id ?? "",
      matricula: aluno?.matricula ?? "",
      curso: aluno?.curso ?? "",
      turno: aluno?.turno ?? "",
      inicioEm: aluno?.inicioEm ?? hoje,
      status: aluno?.status ?? "",
    },
    schema: editando ? atualizarAlunoSchema : criarAlunoSchema,
    paraCorpo: (v) => ({
      nome: v.nome,
      email: v.email,
      ...(!editando && { cpf: v.cpf }),
      telefone: v.telefone,
      instituicaoId: v.instituicaoId || undefined,
      matricula: v.matricula,
      curso: v.curso,
      turno: v.turno || undefined,
      inicioEm: v.inicioEm,
      ...(editando && { status: v.status || undefined }),
    }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  const vaiSairDeAtivo =
    aluno?.status === StatusAluno.ATIVO && valores.status !== "" && valores.status !== StatusAluno.ATIVO;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }

    setEnviando(true);
    const resultado = aluno
      ? await enviarJson(`/api/alunos/${aluno.id}`, "PATCH", form.corpo)
      : await enviarJson("/api/alunos", "POST", form.corpo);
    setEnviando(false);

    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }

    toast.success(editando ? "Aluno atualizado." : "Aluno cadastrado.");
    router.push("/admin/alunos");
    router.refresh();
  }

  /** Props comuns de um input de texto ligado ao formulário. */
  function campoTexto(campo: "nome" | "email" | "matricula" | "curso", obrigatorio = true) {
    return {
      id: campo,
      value: valores[campo],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => atualizar(campo, e.target.value),
      onBlur: () => tocar(campo),
      "aria-required": obrigatorio,
      "aria-invalid": invalido(campo),
    };
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl">
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Dados pessoais</FieldLegend>
          <FieldGroup>
            <Field data-invalid={invalido("nome")}>
              <FieldLabel htmlFor="nome" obrigatorio>
                Nome completo
              </FieldLabel>
              <Input {...campoTexto("nome")} maxLength={LIMITES_ALUNO.nomeMax} autoComplete="off" />
              <FieldError errors={erroDe("nome")} />
            </Field>

            <Field data-invalid={invalido("email")}>
              <FieldLabel htmlFor="email" obrigatorio>
                E-mail
              </FieldLabel>
              <Input
                {...campoTexto("email")}
                type="email"
                maxLength={LIMITES_ALUNO.emailMax}
                autoComplete="off"
                placeholder="nome@exemplo.com"
              />
              <FieldDescription>É o e-mail de acesso do aluno ao sistema.</FieldDescription>
              <FieldError errors={erroDe("email")} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={invalido("cpf")}>
                <FieldLabel htmlFor="cpf" obrigatorio={!editando}>
                  CPF
                </FieldLabel>
                {editando ? (
                  <>
                    <Input id="cpf" value={aluno?.cpfMascarado} disabled className="font-mono" />
                    <FieldDescription>O CPF não pode ser alterado.</FieldDescription>
                  </>
                ) : (
                  <>
                    <Input
                      id="cpf"
                      value={valores.cpf}
                      onChange={(e) => atualizar("cpf", formatarCpf(e.target.value))}
                      onBlur={() => tocar("cpf")}
                      inputMode="numeric"
                      placeholder="000.000.000-00"
                      autoComplete="off"
                      className="font-mono"
                      aria-required
                      aria-invalid={invalido("cpf")}
                    />
                    <FieldError errors={erroDe("cpf")} />
                  </>
                )}
              </Field>

              <Field data-invalid={invalido("telefone")}>
                <FieldLabel htmlFor="telefone" obrigatorio>
                  Telefone
                </FieldLabel>
                <Input
                  id="telefone"
                  value={valores.telefone}
                  onChange={(e) => atualizar("telefone", formatarTelefone(e.target.value))}
                  onBlur={() => tocar("telefone")}
                  inputMode="tel"
                  placeholder="(48) 99999-9999"
                  autoComplete="off"
                  aria-required
                  aria-invalid={invalido("telefone")}
                />
                <FieldError errors={erroDe("telefone")} />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Vínculo acadêmico</FieldLegend>
          <FieldGroup>
            <Field data-invalid={invalido("instituicaoId")}>
              <FieldLabel htmlFor="instituicaoId" obrigatorio>
                Instituição
              </FieldLabel>
              <SelectComCadastro<Instituicao>
                id="instituicaoId"
                opcoes={opcoesInstituicao}
                valor={valores.instituicaoId}
                aoMudar={(v) => {
                  atualizar("instituicaoId", v);
                  tocar("instituicaoId");
                }}
                placeholder="Escolha a instituição"
                invalido={invalido("instituicaoId")}
                obrigatorio
                cadastro={{
                  titulo: "Nova instituição",
                  descricao: "Não está na lista? Cadastre pelo nome e ela já fica selecionada.",
                  rotulo: "Nome da instituição",
                  url: "/api/instituicoes",
                  max: LIMITES_INSTITUICAO.nomeMax,
                  paraOpcao: (i) => ({ value: i.id, label: rotuloInstituicao(i) }),
                }}
              />
              <FieldError errors={erroDe("instituicaoId")} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={invalido("curso")}>
                <FieldLabel htmlFor="curso" obrigatorio>
                  Curso
                </FieldLabel>
                <Input {...campoTexto("curso")} maxLength={LIMITES_ALUNO.cursoMax} />
                <FieldError errors={erroDe("curso")} />
              </Field>

              <Field data-invalid={invalido("matricula")}>
                <FieldLabel htmlFor="matricula">Matrícula</FieldLabel>
                <Input
                  {...campoTexto("matricula", false)}
                  maxLength={LIMITES_ALUNO.matriculaMax}
                  autoComplete="off"
                  className="font-mono"
                />
                <FieldError errors={erroDe("matricula")} />
              </Field>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={invalido("turno")}>
                <FieldLabel htmlFor="turno" obrigatorio>
                  Turno
                </FieldLabel>
                <SelectSimples
                  id="turno"
                  opcoes={opcoesTurno}
                  valor={valores.turno}
                  aoMudar={(v) => {
                    atualizar("turno", v);
                    tocar("turno");
                  }}
                  placeholder="Escolha o turno"
                  invalido={invalido("turno")}
                  obrigatorio
                />
                <FieldError errors={erroDe("turno")} />
              </Field>

              <Field data-invalid={invalido("inicioEm")}>
                <FieldLabel htmlFor="inicioEm" obrigatorio>
                  Início no transporte
                </FieldLabel>
                <Input
                  id="inicioEm"
                  type="date"
                  value={valores.inicioEm}
                  onChange={(e) => atualizar("inicioEm", e.target.value)}
                  onBlur={() => tocar("inicioEm")}
                  aria-required
                  aria-invalid={invalido("inicioEm")}
                />
                <FieldError errors={erroDe("inicioEm")} />
              </Field>
            </div>

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
                {vaiSairDeAtivo && (
                  <FieldDescription className="text-amber-700 dark:text-amber-400">
                    Ao salvar, os planos de transporte em vigor deste aluno serão encerrados.
                  </FieldDescription>
                )}
                <FieldError errors={erroDe("status")} />
              </Field>
            )}
          </FieldGroup>
        </FieldSet>

        <div className="flex gap-2">
          <Button type="submit" disabled={enviando}>
            {enviando ? "Salvando..." : editando ? "Salvar alterações" : "Cadastrar aluno"}
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/admin/alunos" />}>
            Cancelar
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
