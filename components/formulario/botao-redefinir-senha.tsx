"use client";

import { useState } from "react";
import { KeyRoundIcon } from "lucide-react";
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
import { enviarJson } from "@/lib/api";

/**
 * Usuário esqueceu a senha: gera uma provisória nova e mostra uma única vez.
 * `url` é o endpoint POST que redefine (aluno ou administrador).
 */
export function BotaoRedefinirSenha({
  url,
  email,
  tamanho = "sm",
  variante = "outline",
}: {
  url: string;
  email: string;
  tamanho?: "sm" | "xs";
  variante?: "outline" | "ghost";
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);

  async function redefinir() {
    setEnviando(true);
    const resultado = await enviarJson<{ senhaProvisoria: string }>(url, "POST");
    setEnviando(false);
    if (!resultado.ok) {
      toast.error(resultado.erro);
      return;
    }
    setConfirmando(false);
    setSenha(resultado.dados.senhaProvisoria);
  }

  return (
    <>
      <Dialog open={confirmando} onOpenChange={setConfirmando}>
        <DialogTrigger render={<Button variant={variante} size={tamanho} />}>
          <KeyRoundIcon />
          Redefinir senha
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir a senha de {email}?</DialogTitle>
            <DialogDescription>
              A senha atual deixa de funcionar e a pessoa é desconectada de todos os aparelhos. Ela
              entra com a provisória e escolhe uma nova.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Voltar</DialogClose>
            <Button onClick={redefinir} disabled={enviando}>
              {enviando ? "Gerando..." : "Gerar senha provisória"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {senha && (
        <DialogoSegredo
          aberto
          aoFechar={() => setSenha(null)}
          titulo="Nova senha provisória"
          descricao={
            <>
              Repasse para <strong>{email}</strong>. No próximo acesso a pessoa cria a própria senha.
            </>
          }
          rotulo="Senha provisória"
          valor={senha}
        />
      )}
    </>
  );
}
