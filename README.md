# BUSAUM

Sistema de gestão de transporte universitário.

Aplicação **full stack em Next.js** (App Router): a interface usa **React** como
biblioteca e a API vive no mesmo projeto, em Route Handlers dentro de `app/api/`.
Não existe servidor Express separado.

## Como rodar
1. Node 22+ (Next 16 exige >= 20.9; se você usa nvm, `nvm use` lê o `.nvmrc`)
2. `npm install`
3. Copie `.env.example` para `.env.local`
4. `docker compose up -d` (sobe o PostgreSQL 18 com os bancos `busaum_dev` e `busaum_test`)
5. `npm run db:migrate` (cria as tabelas)
6. `npm run db:seed` (popula com dados de exemplo — **apaga tudo antes**)
7. `npm run dev` (aplicação em http://localhost:3000, API em http://localhost:3000/api)

### Dados de exemplo (seed)
As datas são relativas ao dia em que o seed roda: dois meses de histórico com
mensalidades fechadas e duas semanas de viagens à frente. Rodar de novo recria tudo.

- **Admin:** `admin@busaum.dev`
- **Alunos:** Ana, Bruno, Carla, Diego, Eduarda (ativos) e Felipe (inativo), com e-mails
  `nome.sobrenome@aluno.busaum.dev`
- **Veículos:** um ônibus, uma van e um micro-ônibus em manutenção
- **Rotas:** noturno para a URS (ônibus) e matutino para o IFCL (van), com trajetos por pontos
- **Casos de regra de negócio:** troca de plano no meio do mês (Carla), retorno em ponto
  diferente (Diego), diária avulsa (Bruno), viagem cancelada por feriado, justificativas
  aprovada, recusada e pendente, mensalidades paga, aberta, vencida e com ajuste

## Scripts
| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Aplica as migrations no banco de desenvolvimento |
| `npm run db:seed` | Recria os dados de exemplo |
| `npm run db:studio` | Abre o Prisma Studio |

## Documentação
- [Estrutura de pastas](docs/estrutura.md)
- [Arquitetura](docs/arquitetura.md)
- [Modelagem de dados (diagrama ER)](docs/modelagem.md)
