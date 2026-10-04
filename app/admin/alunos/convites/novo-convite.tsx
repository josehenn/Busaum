"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { DialogoSegredo } from "@/components/formulario/dialogo-segredo";
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
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { enviarJson } from "@/lib/api";
import { LIMITES_ALUNO } from "@/lib/esquemas/aluno";
import { VALIDADE_CONVITE_DIAS } from "@/lib/esquemas/convite";

export function NovoConvite() {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  async function gerar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);
    const resultado = await enviarJson<{ token: string }>("/api/convites", "POST", { email });
    setEnviando(false);
    if (!resultado.ok) {
      setErro(resultado.campos.email?.[0] ?? resultado.erro);
      return;
    }
    setAberto(false);
    setEmail("");
    setLink(`${window.location.origin}/cadastro/${resultado.dados.token}`);
    toast.success("Convite gerado.");
    router.refresh();
  }

  return (
    <>
      <Dialog
        open={aberto}
        onOpenChange={(abrir) => {
          setAberto(abrir);
          if (!abrir) setErro(null);
        }}
      >
        <DialogTrigger render={<Button />}>
          <LinkIcon />
          Gerar convite
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={gerar} noValidate className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Novo convite</DialogTitle>
              <DialogDescription>
                O aluno abre o link, preenche os próprios dados e cria a senha. O link vale por{" "}
                {VALIDADE_CONVITE_DIAS} dias e só pode ser usado uma vez.
              </DialogDescription>
            </DialogHeader>
            <Field data-invalid={Boolean(erro)}>
              <FieldLabel htmlFor="email-convite">E-mail do aluno</FieldLabel>
              <Input
                id="email-convite"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErro(null);
                }}
                maxLength={LIMITES_ALUNO.emailMax}
                placeholder="nome@exemplo.com"
                autoFocus
                aria-invalid={Boolean(erro)}
              />
              <FieldDescription>Opcional. Preenchido, só este e-mail consegue usar o convite.</FieldDescription>
              <FieldError>{erro}</FieldError>
            </Field>
            <DialogFooter>
              <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
              <Button type="submit" disabled={enviando}>
                {enviando ? "Gerando..." : "Gerar link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {link && (
        <DialogoSegredo
          aberto
          aoFechar={() => setLink(null)}
          titulo="Link de convite"
          descricao="Envie ao aluno por um canal de confiança (WhatsApp, e-mail institucional)."
          rotulo="Link de convite"
          valor={link}
        />
      )}
    </>
  );
}
