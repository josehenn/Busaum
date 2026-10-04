import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { ErroDeValidacao } from "@/server/comum/erros";
import { manipulador } from "@/server/comum/http";
import { justificativaService } from "@/server/justificativas";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

export const GET = manipulador(async () => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ALUNO);
  return NextResponse.json(await justificativaService.listarDoAluno(usuario.alunoId!));
});

/** POST multipart/form-data: viagemId, motivo, descricao e anexo (arquivo). */
export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ALUNO);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ErroDeValidacao("Envie o formulário como multipart/form-data.");
  }
  const anexo = form.get("anexo");
  await justificativaService.enviar(
    usuario.alunoId!,
    { viagemId: form.get("viagemId"), motivo: form.get("motivo"), descricao: form.get("descricao") },
    anexo instanceof File ? anexo : null,
  );
  return NextResponse.json({ ok: true }, { status: 201 });
});
