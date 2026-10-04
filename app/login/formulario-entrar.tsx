"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CampoSenha } from "@/components/formulario/campo-senha";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { entrarSchema } from "@/lib/esquemas/senha";

export function FormularioEntrar({ proxima }: { proxima: string | null }) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const form = useFormulario({
    inicial: { email: "", senha: "" },
    schema: entrarSchema,
    paraCorpo: (v) => v,
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    if (!form.podeEnviar()) return;

    setEnviando(true);
    // Passa pelo /api/auth (não por Server Action) para valer o limite de tentativas.
    const { error } = await authClient.signIn.email({
      email: valores.email.trim().toLowerCase(),
      password: valores.senha,
    });

    if (error) {
      setEnviando(false);
      atualizar("senha", "");
      // Sempre a mesma mensagem: não revela se o e-mail existe.
      const mensagem =
        error.status === 429
          ? "Muitas tentativas. Aguarde um minuto e tente de novo."
          : "E-mail ou senha incorretos.";
      setErro(mensagem);
      toast.error(mensagem);
      return;
    }
    // Recarga completa: o servidor decide a área pelo perfil (ou a senha provisória).
    window.location.assign(proxima ?? "/login");
  }

  return (
    <form onSubmit={enviar} noValidate>
      <FieldGroup>
        <Field data-invalid={invalido("email")}>
          <FieldLabel htmlFor="email" obrigatorio>
            E-mail
          </FieldLabel>
          <Input
            id="email"
            type="email"
            value={valores.email}
            onChange={(e) => atualizar("email", e.target.value)}
            onBlur={() => tocar("email")}
            autoComplete="username"
            autoFocus
            maxLength={120}
            aria-required
            aria-invalid={invalido("email")}
          />
          <FieldError errors={erroDe("email")} />
        </Field>

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
            autoComplete="current-password"
          />
          <FieldError errors={erroDe("senha")} />
        </Field>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button type="submit" disabled={enviando} className="w-full">
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
      </FieldGroup>
    </form>
  );
}
