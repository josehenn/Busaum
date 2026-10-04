"use client";

// Dois casos:
// - primeira senha (entrou com a provisória): só nova senha + confirmação,
//   pelo /api/conta/primeira-senha — a provisória acabou de ser digitada no login;
// - troca normal: senha atual + nova, pelo Better Auth (/api/auth/change-password).
import { useState } from "react";
import { toast } from "sonner";
import type { z } from "zod";
import { CampoSenha } from "@/components/formulario/campo-senha";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { enviarJson } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import {
  definirPrimeiraSenhaSchema,
  LIMITES_SENHA,
  trocarSenhaSchema,
} from "@/lib/esquemas/senha";

type Campo = "senhaAtual" | "novaSenha" | "confirmacao";

export function FormularioTrocarSenha({ provisoria, destino }: { provisoria: boolean; destino: string }) {
  const [enviando, setEnviando] = useState(false);
  const form = useFormulario({
    inicial: { senhaAtual: "", novaSenha: "", confirmacao: "" },
    schema: (provisoria ? definirPrimeiraSenhaSchema : trocarSenhaSchema) as z.ZodType,
    paraCorpo: (v) => (provisoria ? { novaSenha: v.novaSenha, confirmacao: v.confirmacao } : v),
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!form.podeEnviar()) {
      toast.error("Revise os campos destacados.");
      return;
    }
    setEnviando(true);
    const deuCerto = provisoria ? await criarPrimeiraSenha() : await trocarSenha();
    setEnviando(false);
    if (!deuCerto) return;

    toast.success(provisoria ? "Senha criada. Bem-vindo!" : "Senha alterada.");
    window.location.assign(destino);
  }

  async function criarPrimeiraSenha() {
    const resultado = await enviarJson("/api/conta/primeira-senha", "POST", form.corpo);
    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
    }
    return resultado.ok;
  }

  async function trocarSenha() {
    const { error } = await authClient.changePassword({
      currentPassword: valores.senhaAtual,
      newPassword: valores.novaSenha,
      // Quem tinha a senha antiga (outro aparelho) perde o acesso.
      revokeOtherSessions: true,
    });
    if (!error) return true;
    if (error.status === 429) {
      toast.error("Muitas tentativas. Aguarde um minuto e tente de novo.");
    } else if (error.code === "INVALID_PASSWORD") {
      form.definirErrosServidor({ senhaAtual: ["Senha atual incorreta."] });
      toast.error("Senha atual incorreta.");
    } else {
      toast.error("Não foi possível trocar a senha. Tente de novo.");
    }
    return false;
  }

  function campo(id: Campo, rotulo: string, opcoes: { descricao?: string; foco?: boolean } = {}) {
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
          autoFocus={opcoes.foco}
        />
        {opcoes.descricao && <FieldDescription>{opcoes.descricao}</FieldDescription>}
        <FieldError errors={erroDe(id)} />
      </Field>
    );
  }

  const regra = `De ${LIMITES_SENHA.min} a ${LIMITES_SENHA.max} caracteres, com letras e números.`;

  return (
    <form onSubmit={enviar} noValidate className="max-w-sm">
      <FieldGroup>
        {!provisoria && campo("senhaAtual", "Senha atual", { foco: true })}
        {campo("novaSenha", "Nova senha", { descricao: regra, foco: provisoria })}
        {campo("confirmacao", "Confirme a nova senha")}
        <Button type="submit" disabled={enviando}>
          {enviando ? "Salvando..." : provisoria ? "Criar senha e entrar" : "Trocar senha"}
        </Button>
      </FieldGroup>
    </form>
  );
}
