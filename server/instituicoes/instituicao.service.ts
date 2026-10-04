import type { IInstituicaoRepository, Instituicao } from "./instituicao.repository";

export type InstituicaoDTO = Instituicao;

export class InstituicaoService {
  constructor(private readonly repositorio: IInstituicaoRepository) {}

  listar(): Promise<InstituicaoDTO[]> {
    return this.repositorio.listar();
  }
}
