import { NextResponse } from "next/server";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { alunoService } from "@/server/alunos";
import { lerJson, responderErro } from "@/server/comum/http";
import { exigirPerfilNaApi } from "@/server/sessao/sessao.service";

/** GET /api/alunos?busca=ana&status=ATIVO */
export async function GET(request: Request) {
  try {
    await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const params = new URL(request.url).searchParams;
    const filtro = {
      busca: params.get("busca") ?? undefined,
      status: params.get("status") ?? undefined,
    };
    return NextResponse.json(await alunoService.listar(filtro));
  } catch (erro) {
    return responderErro(erro);
  }
}

export async function POST(request: Request) {
  try {
    const usuario = await exigirPerfilNaApi(PerfilUsuario.ADMIN);
    const aluno = await alunoService.criar(await lerJson(request), usuario.id);
    return NextResponse.json(aluno, { status: 201 });
  } catch (erro) {
    return responderErro(erro);
  }
}
