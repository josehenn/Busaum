import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { lerJson, manipulador } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/alunos?busca=ana&status=ATIVO */
export const GET = manipulador(async (request) => {
  await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const params = new URL(request.url).searchParams;
  const filtro = {
    busca: params.get("busca") ?? undefined,
    status: params.get("status") ?? undefined,
  };
  return NextResponse.json(await alunoService.listar(filtro));
});

/**
 * Cria o aluno com uma senha provisória. A senha vem só nesta resposta (não fica
 * guardada em lugar nenhum além do hash): o admin repassa ao aluno, que é
 * obrigado a trocá-la no primeiro acesso.
 */
export const POST = manipulador(async (request) => {
  const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
  const criado = await alunoService.criar(await lerJson(request), usuario.id);
  return NextResponse.json(criado, { status: 201, headers: { "Cache-Control": "no-store" } });
});
