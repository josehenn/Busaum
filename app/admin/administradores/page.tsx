import type { Metadata } from "next";
import { BotaoAcao } from "@/components/formulario/botao-acao";
import { BotaoRedefinirSenha } from "@/components/formulario/botao-redefinir-senha";
import { CabecalhoPagina } from "@/components/layout/cabecalho-pagina";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatarData } from "@/lib/datas";
import { PerfilUsuario } from "@/lib/generated/prisma/enums";
import { administradorService } from "@/server/administradores";
import { exigirPerfil } from "@/server/sessao/sessao.service";
import { NovoAdministrador } from "./novo-administrador";

export const metadata: Metadata = { title: "Administradores" };

export default async function Administradores() {
  const usuario = await exigirPerfil(PerfilUsuario.ADMIN);
  const administradores = await administradorService.listar();
  const ativos = administradores.filter((a) => a.ativo).length;

  return (
    <>
      <CabecalhoPagina
        titulo="Administradores"
        descricao="Quem tem acesso completo ao sistema. Desative quem não faz mais parte da gestão."
        acoes={<NovoAdministrador />}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="text-center">Situação</TableHead>
              <TableHead className="w-72">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {administradores.map((a) => {
              const voce = a.id === usuario.id;
              return (
                <TableRow key={a.id}>
                  <TableCell>
                    <p className="font-medium">
                      {a.nome}
                      {voce && <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
                  </TableCell>
                  <TableCell>{formatarData(a.criadoEm)}</TableCell>
                  <TableCell className="text-center">
                    {!a.ativo ? (
                      <Badge variant="outline">Inativo</Badge>
                    ) : a.aguardandoPrimeiroAcesso ? (
                      <Badge variant="secondary">Aguardando 1º acesso</Badge>
                    ) : (
                      <Badge>Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!voce && (
                      <div className="flex justify-end gap-2">
                        {a.ativo && (
                          <BotaoRedefinirSenha
                            url={`/api/administradores/${a.id}/senha`}
                            email={a.email}
                            variante="ghost"
                          />
                        )}
                        {a.ativo ? (
                          <BotaoAcao
                            url={`/api/administradores/${a.id}`}
                            metodo="PATCH"
                            corpo={{ ativo: false }}
                            variante="ghost"
                            desabilitado={ativos <= 1}
                            mensagemSucesso="Administrador desativado."
                            confirmacao={{
                              titulo: `Desativar ${a.nome}?`,
                              descricao:
                                "A pessoa é desconectada na hora e não consegue mais entrar. O histórico continua. Dá para reativar depois.",
                              rotuloConfirmar: "Desativar",
                              destrutiva: true,
                            }}
                          >
                            Desativar
                          </BotaoAcao>
                        ) : (
                          <BotaoAcao
                            url={`/api/administradores/${a.id}`}
                            metodo="PATCH"
                            corpo={{ ativo: true }}
                            variante="ghost"
                            mensagemSucesso="Administrador reativado."
                          >
                            Reativar
                          </BotaoAcao>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
