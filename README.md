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
5. `npm run dev` (aplicação em http://localhost:3000, API em http://localhost:3000/api)

## Scripts
| Script | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm run lint` | ESLint |

## Documentação
- [Estrutura de pastas](docs/estrutura.md)
- [Arquitetura](docs/arquitetura.md)
- [Modelagem de dados (diagrama ER)](docs/modelagem.md)
