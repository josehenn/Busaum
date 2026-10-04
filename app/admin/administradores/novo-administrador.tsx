"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { DialogoSegredo } from "@/components/formulario/dialogo-segredo";
import { useFormulario } from "@/components/formulario/use-formulario";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";
import { criarAdministradorSchema } from "@/lib/esquemas/administrador";
import { LIMITES_ALUNO } from "@/lib/esquemas/aluno";

export function NovoAdministrador() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [criado, setCriado] = useState<{ email: string; senha: string } | null>(null);

  const form = useFormulario({
    inicial: { nome: "", email: "" },
    schema: criarAdministradorSchema,
    paraCorpo: (v) => v,
  });
  const { valores, atualizar, tocar, erroDe, invalido } = form;

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    if (!form.podeEnviar()) return;

    setEnviando(true);
    const resultado = await enviarJson<{ administrador: { email: string }; senhaProvisoria: string }>(
      "/api/administradores",
      "POST",
      form.corpo,
    );
    setEnviando(false);
    if (!resultado.ok) {
      form.definirErrosServidor(resultado.campos);
      toast.error(resultado.erro);
      return;
    }
    toast.success("Administrador cadastrado.");
    setAberto(false);
    atualizar("nome", "");
    atualizar("email", "");
    setCriado({ email: resultado.dados.administrador.email, senha: resultado.dados.senhaProvisoria });
    router.refresh();
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogTrigger render={<Button />}>
          <PlusIcon />
          Novo administrador
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={enviar} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Novo administrador</DialogTitle>
              <DialogDescription>
                Terá acesso completo ao sistema. Uma senha provisória é gerada ao salvar; no primeiro
                acesso a pessoa cria a própria senha.
              </DialogDescription>
            </DialogHeader>
            <FieldGroup>
              <Field data-invalid={invalido("nome")}>
                <FieldLabel htmlFor="nome-admin" obrigatorio>
                  Nome completo
                </FieldLabel>
                <Input
                  id="nome-admin"
                  value={valores.nome}
                  onChange={(e) => atualizar("nome", e.target.value)}
                  onBlur={() => tocar("nome")}
                  maxLength={LIMITES_ALUNO.nomeMax}
                  autoFocus
                  aria-required
                  aria-invalid={invalido("nome")}
                />
                <FieldError errors={erroDe("nome")} />
              </Field>
              <Field data-invalid={invalido("email")}>
                <FieldLabel htmlFor="email-admin" obrigatorio>
                  E-mail
                </FieldLabel>
                <Input
                  id="email-admin"
                  type="email"
                  value={valores.email}
                  onChange={(e) => atualizar("email", e.target.value)}
                  onBlur={() => tocar("email")}
                  maxLength={LIMITES_ALUNO.emailMax}
                  placeholder="nome@exemplo.com"
                  autoComplete="off"
                  aria-required
                  aria-invalid={invalido("email")}
                />
                <FieldError errors={erroDe("email")} />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {criado && (
        <DialogoSegredo
          aberto
          aoFechar={() => setCriado(null)}
          titulo="Senha provisória do administrador"
          descricao={
            <>
              Repasse para <strong>{criado.email}</strong>. No primeiro acesso a pessoa cria a própria
              senha.
            </>
          }
          rotulo="Senha provisória"
          valor={criado.senha}
        />
      )}
    </>
  );
}
