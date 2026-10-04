"use client";

// Autocadastro pelo convite: mesmos campos e regras do cadastro pelo admin
// (lib/esquemas/aluno.ts), sem a data de início, mais a senha. A instituição só
// pode ser escolhida da lista — cadastrar instituição nova é com o admin.
import { useState } from "react";
import { toast } from "sonner";
import { CampoSenha } from "@/components/formulario/campo-senha";
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
import { authClient } from "@/lib/auth-client";
import { LIMITES_ALUNO } from "@/lib/esquemas/aluno";
import { cadastroPorConviteSchema } from "@/lib/esquemas/convite";
import { LIMITES_SENHA } from "@/lib/esquemas/senha";
import { formatarCpf, formatarTelefone } from "@/lib/mascaras";
import { opcoes, rotuloTurno } from "@/lib/rotulos";

type Instituicao = { id: string; nome: string; sigla: string | null };
const opcoesTurno = opcoes(rotuloTurno);

export function FormularioCadastro({
  token,
  emailFixo,
  instituicoes,
}: {
  token: string;
  emailFixo: string | null;
  instituicoes: Instituicao[];
}) {
  const [enviando, setEnviando] = useState(false);
  const opcoesInstituicao = instituicoes.map((i) => ({
    value: i.id,
    label: i.sigla ? `${i.sigla} — ${i.nome}` : i.nome,
  }));

  const form = useFormulario({
    inicial: {
      nome: "",
      email: emailFixo ?? "",
      cpf: "",
      telefone: "",
      instituicaoId: "",
      matricula: "",
      curso: "",
      turno: "",
      senha: "",
      confirmacao: "",
    },
    schema: cadastroPorConviteSchema,
    paraCorpo: (v) => ({ ...v, instituicaoId: v.instituicaoId || undefined, turno: v.turno || undefined }),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setEnviando(true);
    const resultado = await enviarJson<{ email: string }>(
      `/api/cadastro/${encodeURIComponent(token)}`,
      "POST",
      form.corpo,
    );
    if (!resultado.ok) {
      setEnviando(false);
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }

    // Cadastro feito: entra direto com a senha que acabou de criar.
    const { error } = await authClient.signIn.email({ email: resultado.dados.email, password: valores.senha });
    toast.success("Cadastro concluído. Bem-vindo ao Busaum!");
    window.location.assign(error ? "/login" : "/aluno");
  }

  function texto(campo: "nome" | "email" | "matricula" | "curso", rotulo: string, opcoesCampo: {
    max: number;
    obrigatorio?: boolean;
    tipo?: string;
    autoComplete?: string;
    descricao?: string;
    somenteLeitura?: boolean;
  }) {
    return (
      <Field data-invalid={invalido(campo)}>
        <FieldLabel htmlFor={campo} obrigatorio={opcoesCampo.obrigatorio}>
          {rotulo}
        </FieldLabel>
        <Input
          id={campo}
          type={opcoesCampo.tipo}
          value={valores[campo]}
          onChange={(e) => atualizar(campo, e.target.value)}
          onBlur={() => tocar(campo)}
          maxLength={opcoesCampo.max}
          autoComplete={opcoesCampo.autoComplete}
          readOnly={opcoesCampo.somenteLeitura}
          aria-required={opcoesCampo.obrigatorio}
          aria-invalid={invalido(campo)}
        />
        {opcoesCampo.descricao && <FieldDescription>{opcoesCampo.descricao}</FieldDescription>}
        <FieldError errors={erroDe(campo)} />
      </Field>
    );
  }

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Seus dados</FieldLegend>
          <FieldGroup>
            {texto("nome", "Nome completo", { max: LIMITES_ALUNO.nomeMax, obrigatorio: true, autoComplete: "name" })}
            {texto("email", "E-mail", {
              max: LIMITES_ALUNO.emailMax,
              obrigatorio: true,
              tipo: "email",
              autoComplete: "email",
              somenteLeitura: Boolean(emailFixo),
              descricao: emailFixo ? "Este convite foi enviado para este e-mail." : "É com ele que você vai entrar.",
            })}
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={invalido("cpf")}>
                <FieldLabel htmlFor="cpf" obrigatorio>
                  CPF
                </FieldLabel>
                <Input
                  id="cpf"
                  value={valores.cpf}
                  onChange={(e) => atualizar("cpf", formatarCpf(e.target.value))}
                  onBlur={() => tocar("cpf")}
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  className="font-mono"
                  aria-required
                  aria-invalid={invalido("cpf")}
                />
                <FieldError errors={erroDe("cpf")} />
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
                  autoComplete="tel"
                  placeholder="(48) 99999-9999"
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
              <SelectSimples
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
              />
              <FieldDescription>Não encontrou a sua? Fale com a administração do transporte.</FieldDescription>
              <FieldError errors={erroDe("instituicaoId")} />
            </Field>
            <div className="grid gap-6 sm:grid-cols-2">
              {texto("curso", "Curso", { max: LIMITES_ALUNO.cursoMax, obrigatorio: true })}
              {texto("matricula", "Matrícula", { max: LIMITES_ALUNO.matriculaMax })}
            </div>
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
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Senha de acesso</FieldLegend>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={invalido("senha")}>
                <FieldLabel htmlFor="senha" obrigatorio>
                  Senha
                </FieldLabel>
                <CampoSenha
                  id="senha"
                  valor={valores.senha}
                  aoMudar={(v) => atualizar("senha", v)}
                  aoSair={() => tocar("senha")}
                  invalido={invalido("senha")}
                  obrigatorio
                  autoComplete="new-password"
                />
                <FieldDescription>
                  De {LIMITES_SENHA.min} a {LIMITES_SENHA.max} caracteres, com letras e números.
                </FieldDescription>
                <FieldError errors={erroDe("senha")} />
              </Field>
              <Field data-invalid={invalido("confirmacao")}>
                <FieldLabel htmlFor="confirmacao" obrigatorio>
                  Confirme a senha
                </FieldLabel>
                <CampoSenha
                  id="confirmacao"
                  valor={valores.confirmacao}
                  aoMudar={(v) => atualizar("confirmacao", v)}
                  aoSair={() => tocar("confirmacao")}
                  invalido={invalido("confirmacao")}
                  obrigatorio
                  autoComplete="new-password"
                />
                <FieldError errors={erroDe("confirmacao")} />
              </Field>
            </div>
          </FieldGroup>
        </FieldSet>

        <Button type="submit" disabled={enviando}>
          {enviando ? "Cadastrando..." : "Concluir cadastro"}
        </Button>
      </FieldGroup>
    </form>
  );
}
