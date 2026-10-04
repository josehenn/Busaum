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

/** Aluno esqueceu a senha: gera uma provisória nova e mostra uma única vez. */
export function BotaoRedefinirSenha({ alunoId, email }: { alunoId: string; email: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);

  async function redefinir() {
    setEnviando(true);
    const resultado = await enviarJson<{ senhaProvisoria: string }>(`/api/alunos/${alunoId}/senha`, "POST");
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
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <KeyRoundIcon />
          Redefinir senha
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir a senha do aluno?</DialogTitle>
            <DialogDescription>
              A senha atual deixa de funcionar e o aluno é desconectado de todos os aparelhos. Ele
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
              Repasse ao aluno (<strong>{email}</strong>). No próximo acesso ele cria a própria senha.
            </>
          }
          rotulo="Senha provisória"
          valor={senha}
        />
      )}
    </>
  );
}
