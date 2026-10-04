# 🚌 BUSAUM

### Sistema de Gestão de Transporte Universitário

O **BUSAUM** é uma aplicação web full stack desenvolvida para o gerenciamento de transporte universitário, permitindo controlar alunos, veículos, rotas, pontos de embarque, viagens, planos de transporte, declarações, justificativas, mensalidades e despesas.

O projeto foi desenvolvido para a disciplina de **Programação 4**, com foco na aplicação prática de conceitos de **Arquitetura de Software, Design Patterns, separação de responsabilidades e boas práticas de desenvolvimento**.

---

## 🎥 Vídeo de apresentação

> **Assista ao vídeo de apresentação do projeto:**  
> 🔗 **[LINK DO VÍDEO — INSERIR AQUI]**

No vídeo apresentamos a aplicação em funcionamento e demonstramos os principais **Design Patterns utilizados no desenvolvimento do BUSAUM**, relacionando cada padrão com sua aplicação prática no sistema.

---

# 📌 Sobre o projeto

O BUSAUM foi desenvolvido para solucionar problemas relacionados ao gerenciamento de transporte universitário.

A aplicação centraliza informações administrativas e operacionais em um único sistema, permitindo que administradores controlem a operação do transporte enquanto alunos acompanham suas viagens, planos e mensalidades.

O sistema foi desenvolvido como uma aplicação **full stack em Next.js**, mantendo a interface, API e regras de negócio dentro do mesmo projeto.

---

# 🎯 Objetivos

Os principais objetivos do projeto são:

- Centralizar o gerenciamento do transporte universitário;
- Controlar alunos e administradores;
- Gerenciar veículos e suas capacidades;
- Cadastrar e organizar rotas e pontos;
- Controlar planos de transporte dos alunos;
- Gerenciar viagens;
- Permitir que alunos informem ausências;
- Permitir o envio e análise de justificativas;
- Realizar a apuração das mensalidades;
- Registrar despesas relacionadas aos veículos;
- Disponibilizar informações através de uma área de transparência;
- Aplicar Design Patterns para reduzir acoplamento e facilitar a manutenção do sistema.

---

# ⚙️ Funcionalidades

## 👨‍💼 Área administrativa

O administrador possui acesso às funcionalidades de gerenciamento do sistema.

### Alunos

- Cadastro de alunos;
- Edição de alunos;
- Inativação e alteração de status;
- Gerenciamento de senha;
- Convites para novos alunos;
- Cadastro de alunos com senha provisória.

### Administradores

- Cadastro de administradores;
- Gerenciamento de administradores;
- Redefinição de senha.

### Veículos

- Cadastro de veículos;
- Edição de veículos;
- Controle de capacidade;
- Controle de status;
- Identificação do tipo de veículo;
- Controle de veículos em manutenção.

### Pontos

- Cadastro de pontos de embarque;
- Endereço e informações de localização;
- Associação com instituições;
- Ativação e desativação de pontos.

### Rotas

- Cadastro de rotas;
- Definição de veículo;
- Horários de ida e volta;
- Dias de operação;
- Valor da diária;
- Prazo para declarações;
- Definição do trajeto através dos pontos.

### Planos

- Contratação de planos de transporte;
- Definição dos dias utilizados;
- Definição dos pontos de embarque, destino e retorno;
- Controle de vigência;
- Encerramento de planos.

### Viagens

- Geração e acompanhamento de viagens;
- Visualização de passageiros esperados;
- Alteração do veículo da viagem;
- Cancelamento de viagens;
- Identificação de situações em que a capacidade do veículo é insuficiente.

### Justificativas

- Visualização das justificativas enviadas pelos alunos;
- Análise dos anexos;
- Aprovação ou recusa;
- Aplicação do impacto financeiro de uma justificativa aprovada.

### Mensalidades

- Apuração das mensalidades;
- Fechamento de competências;
- Visualização das diárias;
- Registro de pagamentos;
- Controle de mensalidades abertas, pagas, vencidas e canceladas;
- Ajustes manuais.

### Despesas

- Registro de despesas;
- Associação de despesas aos veículos;
- Categorias como combustível, manutenção, pedágio, seguro e salário;
- Anexos de comprovantes.

---

# 👨‍🎓 Área do aluno

O aluno possui acesso às funcionalidades relacionadas ao seu próprio transporte.

Entre elas:

- Visualização das próximas viagens;
- Declaração de utilização;
- Declaração de ausência;
- Visualização do plano contratado;
- Envio de justificativas;
- Anexação de documentos;
- Consulta de mensalidades;
- Consulta de detalhes das cobranças;
- Alteração da senha.

---

# 📊 Transparência

O sistema possui uma área pública de **Transparência**, permitindo consultar informações relacionadas às despesas e aos veículos do transporte universitário.

Essa funcionalidade busca aumentar a visibilidade das informações financeiras e operacionais relacionadas ao sistema.

---

# 🏗️ Arquitetura

O BUSAUM utiliza uma arquitetura **Full Stack com Next.js**, utilizando o App Router.

Não existe um servidor Express separado. A API é implementada através dos **Route Handlers do Next.js**.

A arquitetura pode ser representada da seguinte forma:

```text
┌─────────────────────────────────────────┐
│              APRESENTAÇÃO               │
│                                         │
│       Next.js + React + Components      │
│          app/ + components/             │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│                  API                    │
│                                         │
│        Next.js Route Handlers           │
│              app/api/                   │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│                DOMÍNIO                  │
│                                         │
│       Services + regras de negócio      │
│                server/                  │
└───────────────────┬─────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│             PERSISTÊNCIA                │
│                                         │
│              Repository                 │
│                 Prisma                  │
│              PostgreSQL                 │
└─────────────────────────────────────────┘
```

### Fluxo de uma requisição

```text
Navegador
    │
    ├── Navegação
    │      ↓
    │   Server Component
    │      ↓
    │   Service
    │      ↓
    │   Repository
    │      ↓
    │   PostgreSQL
    │
    └── Requisição HTTP
           ↓
       Route Handler
           ↓
        Service
           ↓
       Repository
           ↓
       PostgreSQL
```

Uma das decisões arquiteturais do projeto foi evitar que Server Components façam requisições HTTP para a própria API. Quando a operação ocorre no servidor, o componente pode chamar diretamente o Service.

Os Route Handlers são utilizados para operações realizadas pelo navegador, Client Components e integrações externas.

---

# 🧩 Design Patterns

A aplicação utiliza diferentes Design Patterns para organizar as responsabilidades e reduzir o acoplamento entre os componentes.

Os principais padrões utilizados são:

| Pattern | Implementação | Objetivo |
|---|---|---|
| **Repository** | `server/*/*.repository.ts` | Separar regras de negócio do acesso ao banco |
| **Dependency Injection** | Construtores dos Services + `server/repositorios.ts` | Injetar dependências e reduzir acoplamento |
| **DTO** | `server/*/*.dto.ts` e schemas em `lib/esquemas/` | Controlar os dados de entrada e saída |
| **Adapter** | `server/arquivos/` | Permitir diferentes mecanismos de armazenamento |
| **Strategy** | `server/pagamentos/` | Permitir diferentes estratégias de pagamento |
| **Singleton** | `lib/prisma.ts` | Manter uma única instância do Prisma |
| **MVC adaptado** | `app/`, `server/`, `app/api/` | Separar apresentação, domínio e entrada HTTP |
| **Middleware** | `proxy.ts` e `server/comum/http.ts` | Centralizar verificações e tratamento de requisições |
| **DAL** | `server/sessao/sessao.service.ts` | Centralizar o acesso aos dados da sessão |

---

## Repository Pattern

O **Repository Pattern** é utilizado para separar a lógica de negócio do acesso ao banco de dados.

Cada módulo possui uma interface de repositório e uma implementação específica utilizando Prisma.

Exemplo:

```text
IVeiculoRepository
       │
       ▼
PrismaVeiculoRepository
       │
       ▼
     Prisma
       │
       ▼
  PostgreSQL
```

O Service depende da interface e não diretamente do Prisma.

Isso permite substituir a implementação do acesso aos dados sem alterar as regras de negócio.

---

## Dependency Injection

Os Services recebem seus repositórios através do construtor.

Exemplo conceitual:

```text
VeiculoService
      │
      └── IVeiculoRepository
                │
                └── PrismaVeiculoRepository
```

A composição das dependências é centralizada em:

```text
server/repositorios.ts
```

Dessa forma, o Service não precisa criar sua própria dependência.

### Benefícios

- Menor acoplamento;
- Maior testabilidade;
- Facilidade para trocar implementações;
- Separação de responsabilidades.

---

## DTO — Data Transfer Object

O projeto utiliza DTOs para controlar as informações que entram e saem das diferentes camadas da aplicação.

Os DTOs de saída são encontrados em módulos como:

```text
server/alunos/aluno.dto.ts
server/pontos/ponto.dto.ts
server/veiculos/veiculo.dto.ts
```

Os schemas de entrada são organizados em:

```text
lib/esquemas/
```

A utilização desses contratos permite controlar quais informações são expostas pela aplicação.

Isso é especialmente importante para informações sensíveis, como CPF e telefone.

---

## Adapter Pattern

O **Adapter Pattern** é utilizado no armazenamento de arquivos.

O sistema possui uma interface comum:

```text
IStorageService
```

e diferentes implementações:

```text
                 IStorageService
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
   LocalStorageService   VercelBlobStorageService
```

No ambiente de desenvolvimento, os arquivos podem ser armazenados localmente.

Na produção, o sistema utiliza o **Vercel Blob**.

A camada de negócio não precisa saber onde o arquivo está sendo armazenado.

### Benefício

É possível trocar o mecanismo de armazenamento sem alterar as regras de negócio.

---

## Strategy Pattern

O **Strategy Pattern** é utilizado no módulo de pagamentos.

O sistema define uma interface:

```text
PaymentGateway
```

com uma implementação utilizada no projeto:

```text
FakePaymentGateway
```

Fluxo:

```text
Mensalidade
     │
     ▼
PaymentGateway
     │
     ▼
FakePaymentGateway
```

O objetivo é permitir que futuramente seja utilizado um gateway real de pagamento, como Pix ou boleto, sem precisar modificar as regras de negócio das mensalidades.

No projeto acadêmico, o `FakePaymentGateway` permite simular o comportamento de um provedor de pagamento sem depender de uma integração externa.

---

## Singleton Pattern

O Singleton é utilizado na criação do cliente Prisma.

O arquivo:

```text
lib/prisma.ts
```

mantém uma única instância do Prisma durante o desenvolvimento.

Isso evita a criação de várias instâncias do cliente durante o **hot reload** do Next.js.

---

## MVC Adaptado

O projeto utiliza uma adaptação do padrão **MVC** considerando a arquitetura do Next.js.

### Model

Representado principalmente pelo modelo de dados e pela camada de persistência:

```text
prisma/schema.prisma
server/*/*.repository.ts
```

### View

Representada pelas páginas e componentes React:

```text
app/**/page.tsx
components/
```

### Controller

Representado pelos Route Handlers:

```text
app/api/**/route.ts
```

Os Route Handlers recebem as requisições HTTP e encaminham as operações para os Services.

---

## Middleware

O projeto possui mecanismos centralizados para tratamento das requisições.

O arquivo:

```text
proxy.ts
```

realiza verificações iniciais relacionadas à sessão e ao acesso às áreas protegidas.

Além disso, o módulo:

```text
server/comum/http.ts
```

centraliza comportamentos comuns aos Route Handlers, incluindo tratamento de origem e erros.

A autorização também é verificada na API através de funções como:

```text
exigirPerfilNaApi()
```

Isso evita que uma proteção existente apenas na interface possa ser contornada através de uma requisição direta à API.

---

# 🔐 Autenticação e segurança

A autenticação é realizada utilizando **Better Auth**, com login através de e-mail e senha.

As sessões são armazenadas no banco de dados.

O acesso ao sistema possui diferentes níveis de proteção:

```text
Proxy
  ↓
Página/Layout
  ↓
Route Handler
  ↓
Service
```

Entre as medidas implementadas estão:

- Controle de sessão;
- Controle de perfil (`ADMIN` e `ALUNO`);
- Senhas armazenadas através de hash;
- Limitação de tentativas de login;
- Proteção contra CSRF;
- Cookies `httpOnly` e `SameSite`;
- Controle de autorização nas APIs;
- Convites de cadastro com token;
- Tokens de convite armazenados como SHA-256;
- Controle de senha provisória;
- Proteção contra redirecionamentos externos;
- Controle de acesso aos anexos;
- Não exposição de dados sensíveis através dos DTOs.

---

# 📎 Armazenamento de arquivos

Os anexos de justificativas e despesas são armazenados através da abstração `IStorageService`.

No desenvolvimento:

```text
LocalStorageService
```

utiliza o armazenamento local.

Em produção:

```text
VercelBlobStorageService
```

utiliza o Vercel Blob com acesso privado.

Os arquivos não são expostos diretamente através de URLs públicas.

O acesso ocorre através de uma API que verifica a sessão e as permissões do usuário.

---

# 🗄️ Banco de Dados

O projeto utiliza:

- **PostgreSQL** como banco de dados;
- **Prisma ORM** como camada de acesso;
- **Prisma Migrate** para controle das migrations.

Entre as principais entidades estão:

```text
Usuario
Aluno
Instituicao
Veiculo
Rota
Ponto
RotaPonto
PlanoRota
Viagem
Declaracao
Justificativa
Mensalidade
Diaria
Despesa
Convite
Sessao
Conta
```

O modelo de dados considera regras específicas do transporte universitário, como:

- Capacidade dos veículos;
- Dias de operação;
- Planos com vigência;
- Pontos de embarque e destino;
- Viagens;
- Ausências;
- Justificativas;
- Diárias;
- Mensalidades;
- Despesas.

O diagrama de entidade-relacionamento está disponível em:

📄 [`docs/modelagem.md`](docs/modelagem.md)

---

# 💰 Regra de cobrança

A cobrança do sistema é baseada nas **diárias de transporte**.

De forma simplificada:

```text
Plano do aluno
      ↓
Dias contratados
      ↓
Viagens previstas
      ↓
Diárias
      ↓
Mensalidade
```

Uma diária pode ser:

- Cobrada normalmente;
- Isenta por justificativa aprovada;
- Isenta quando a viagem é cancelada.

O sistema também permite declarações avulsas para dias que não fazem parte do plano contratado.

---

# 📂 Estrutura do projeto

```text
BUSAUM/
│
├── app/
│   ├── admin/                  # Área administrativa
│   ├── aluno/                  # Área do aluno
│   ├── conta/                  # Conta do usuário
│   ├── cadastro/               # Cadastro através de convite
│   ├── login/                  # Autenticação
│   ├── transparencia/          # Área pública de transparência
│   └── api/                    # Route Handlers
│
├── components/
│   ├── ui/                     # Componentes de interface
│   └── layout/                 # Componentes de layout
│
├── server/
│   ├── administradores/
│   ├── alunos/
│   ├── arquivos/
│   ├── auth/
│   ├── convites/
│   ├── declaracoes/
│   ├── despesas/
│   ├── instituicoes/
│   ├── justificativas/
│   ├── mensalidades/
│   ├── pagamentos/
│   ├── planos/
│   ├── pontos/
│   ├── rotas/
│   ├── sessao/
│   ├── transparencia/
│   ├── veiculos/
│   ├── viagens/
│   └── repositorios.ts
│
├── lib/
│   ├── esquemas/               # Schemas Zod
│   ├── datas.ts
│   ├── dinheiro.ts
│   ├── mascaras.ts
│   ├── prisma.ts
│   └── rotulos.ts
│
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
│
├── docs/
│   ├── arquitetura.md
│   ├── estrutura.md
│   └── modelagem.md
│
├── tests/
│
├── proxy.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── docker-compose.yml
```

---

# 🛠️ Tecnologias utilizadas

## Front-end

| Tecnologia | Utilização |
|---|---|
| **Next.js 16** | Framework principal da aplicação |
| **React 19** | Construção da interface |
| **TypeScript 5.9** | Tipagem estática |
| **Tailwind CSS 4** | Estilização |
| **shadcn/ui** | Componentes de interface |
| **Lucide React** | Ícones |
| **Sonner** | Notificações |

## Back-end

| Tecnologia | Utilização |
|---|---|
| **Next.js Route Handlers** | API da aplicação |
| **TypeScript** | Implementação dos Services e regras |
| **Zod** | Validação de dados |
| **Better Auth** | Autenticação e sessões |

## Banco de dados

| Tecnologia | Utilização |
|---|---|
| **PostgreSQL 18** | Banco de dados |
| **Prisma 7** | ORM e acesso aos dados |
| **Prisma Migrate** | Migrations |
| **Prisma Adapter PG** | Integração Prisma/PostgreSQL |

## Infraestrutura

| Tecnologia | Utilização |
|---|---|
| **Docker** | Ambiente local do PostgreSQL |
| **Vercel** | Deploy da aplicação |
| **Vercel Blob** | Armazenamento de arquivos em produção |

---

# 🧪 Qualidade e validação

O projeto possui configuração de **ESLint** para análise estática do código.

Para verificar o código:

```bash
npm run lint
```

O projeto também possui uma estrutura destinada a testes em:

```text
tests/
```

---

# 🚀 Como executar o projeto

## Pré-requisitos

- Node.js 22;
- npm;
- Docker;
- Docker Compose.

A versão do Node utilizada pelo projeto está definida em:

```text
.nvmrc
```

---

## 1. Clonar o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd Busaum-main
```

---

## 2. Instalar as dependências

```bash
npm install
```

---

## 3. Configurar as variáveis de ambiente

Copie:

```text
.env.example
```

para:

```text
.env.local
```

Configure principalmente:

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_APP_URL=
```

Para gerar um segredo para o Better Auth:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 4. Iniciar o PostgreSQL

Execute:

```bash
docker compose up -d
```

O Docker iniciará o PostgreSQL utilizado pelo projeto.

---

## 5. Criar as tabelas

Execute:

```bash
npm run db:migrate
```

---

## 6. Popular o banco

Para criar os dados de demonstração:

```bash
npm run db:seed
```

> ⚠️ O seed recria os dados de exemplo.

Os usuários de demonstração utilizam a senha:

```text
busaum123
```

### Administrador

```text
admin@busaum.dev
```

### Alunos

Os alunos de exemplo possuem e-mails no formato:

```text
nome.sobrenome@aluno.busaum.dev
```

---

## 7. Iniciar a aplicação

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

---

# 📜 Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm start` | Inicia o build de produção |
| `npm run lint` | Executa o ESLint |
| `npm run db:migrate` | Executa as migrations |
| `npm run db:seed` | Popula o banco com dados de demonstração |
| `npm run db:studio` | Abre o Prisma Studio |

---

# 📚 Documentação

O projeto possui documentação complementar:

### Arquitetura

📄 [`docs/arquitetura.md`](docs/arquitetura.md)

Detalha:

- Arquitetura da aplicação;
- Fluxo das requisições;
- Camadas;
- Design Patterns;
- Autenticação;
- Autorização;
- Regras de domínio.

### Estrutura do projeto

📄 [`docs/estrutura.md`](docs/estrutura.md)

Apresenta:

- Organização das pastas;
- Responsabilidade de cada diretório;
- Convenções utilizadas;
- Fluxo entre as camadas.

### Modelagem

📄 [`docs/modelagem.md`](docs/modelagem.md)

Apresenta:

- Modelo de dados;
- Regras de cobrança;
- Entidades;
- Relacionamentos;
- Diagrama ER.

---

# 🌐 Aplicação

A aplicação está disponível em:

🔗 **https://busaum.vercel.app/**

---

# 🎥 Vídeo do projeto

O vídeo apresenta:

1. O problema que o BUSAUM busca solucionar;
2. A aplicação em funcionamento;
3. As principais funcionalidades;
4. A arquitetura utilizada;
5. Os principais Design Patterns;
6. A aplicação prática dos padrões dentro do sistema.

🔗 **[ASSISTIR AO VÍDEO](LINK_DO_VIDEO_AQUI)**

---

# 👨‍💻 Equipe

| Integrante | Responsabilidade |
|---|---|
| **Ivan Nerilo** | Desenvolvimento |
| **José Augusto Henn** | Desenvolvimento |
| **Josué Borges** | Desenvolvimento |

Projeto desenvolvido para a disciplina de **Programação 4**.

---

# 📌 Considerações finais

O BUSAUM foi desenvolvido com o objetivo de aplicar conceitos de engenharia de software em uma aplicação completa.

Além das funcionalidades relacionadas ao gerenciamento do transporte universitário, o projeto buscou aplicar conceitos de:

- Arquitetura em camadas;
- Separação de responsabilidades;
- Design Patterns;
- Injeção de dependência;
- Abstração;
- Validação;
- Autenticação e autorização;
- Persistência de dados;
- Segurança;
- Organização e manutenção de código.

Os Design Patterns utilizados permitem reduzir o acoplamento entre os componentes e facilitam futuras alterações na aplicação, como a substituição do mecanismo de armazenamento de arquivos ou a integração com um provedor real de pagamentos.

---

<p align="center">
  <strong>🚌 BUSAUM — Gestão de Transporte Universitário</strong>
</p>

<p align="center">
  Projeto desenvolvido para a disciplina de Programação 4.
</p>