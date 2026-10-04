"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CampoSenha } from "@/components/formulario/campo-senha";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { LIMITES_SENHA, trocarSenhaSchema } from "@/lib/esquemas/senha";

type Campo = "senhaAtual" | "novaSenha" | "confirmacao";

export function FormularioTrocarSenha({ provisoria, destino }: { provisoria: boolean; destino: string }) {
  const [enviando, setEnviando] = useState(false);
  const form = useFormulario({
    inicial: { senhaAtual: "", novaSenha: "", confirmacao: "" },
    schema: trocarSenhaSchema,
    paraCorpo: (v) => v,
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setEnviando(true);
    const { error } = await authClient.changePassword({
      currentPassword: valores.senhaAtual,
      newPassword: valores.novaSenha,
      // Quem tinha a senha antiga (outro aparelho, quem a criou) perde o acesso.
      revokeOtherSessions: true,
    });
    setEnviando(false);

    if (error) {
      if (error.status === 429) {
        toast.error("Muitas tentativas. Aguarde um minuto e tente de novo.");
      } else if (error.code === "INVALID_PASSWORD") {
        form.definirErrosServidor({ senhaAtual: ["Senha atual incorreta."] });
        toast.error("Senha atual incorreta.");
      } else {
        toast.error("Não foi possível trocar a senha. Tente de novo.");
      }
      return;
    }
    toast.success("Senha alterada.");
    window.location.assign(destino);
  }

  function campo(id: Campo, rotulo: string, descricao?: string) {
    return (
      <Field data-invalid={invalido(id)}>
        <FieldLabel htmlFor={id} obrigatorio>
          {rotulo}
        </FieldLabel>
        <CampoSenha
          id={id}
          valor={valores[id]}
          aoMudar={(v) => atualizar(id, v)}
          aoSair={() => tocar(id)}
          invalido={invalido(id)}
          obrigatorio
          autoComplete={id === "senhaAtual" ? "current-password" : "new-password"}
          autoFocus={id === "senhaAtual"}
        />
        {descricao && <FieldDescription>{descricao}</FieldDescription>}
        <FieldError errors={erroDe(id)} />
      </Field>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="max-w-sm">
      <FieldGroup>
        {campo("senhaAtual", provisoria ? "Senha provisória" : "Senha atual")}
        {campo(
          "novaSenha",
          "Nova senha",
          `De ${LIMITES_SENHA.min} a ${LIMITES_SENHA.max} caracteres, com letras e números.`,
        )}
        {campo("confirmacao", "Confirme a nova senha")}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : "Trocar senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
