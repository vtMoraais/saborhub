# 🥗 SaborHub — API & Plataforma de Gestão Gastronômica

Projeto acadêmico desenvolvido em **Node.js**, **Express**, **Prisma ORM** e **PostgreSQL**, estruturado sob **Arquitetura em Camadas** com autenticação **JWT** e pipeline de otimização de imagens via **Multer + Sharp**.

---

## 🏗️ Arquitetura do Projeto

O fluxo de dados segue a separação de responsabilidades:
`Routes → Controller → Service → Database (Prisma)`

```text
src/
 ├── config/
 │    └── env.js                   # Leitura e validação das variáveis de ambiente
 ├── database/
 │    └── prisma.js                # Instância do PrismaClient
 ├── modules/
 │    ├── auth/                    # Registro, Login JWT, Avatar e histórico de atividades
 │    ├── restaurant/              # Listagem, Criação de Restaurantes e Pratos
 │    ├── dishes/                  # Upload otimizado de fotos dos pratos
 │    └── shared/                  # ImageService (Sharp -> WebP), Multer, validações,
 │                                 # tratamento central de erros e registro de atividades
 └── app.js                        # Configuração de middlewares e rotas Express
prisma/
 ├── schema.prisma                 # Modelos User, Restaurant, Dish e Activity
 └── migrations/                   # Histórico versionado do schema do banco
adrs/                              # Registros de decisões de arquitetura (ADRs)
index.html                         # Front-end (catálogo e cadastro de restaurantes)
teste.js                           # Testes automatizados (node:test)
```

As decisões de arquitetura estão documentadas em [`adrs/`](adrs/):

1. [ADR 001](adrs/001-armazenamento-inicial-memoria.md): armazenamento em memória na prototipação.
2. [ADR 002](adrs/002-persistencia-relacional-postgresql.md): PostgreSQL + Prisma.
3. [ADR 003](adrs/003-estrategia-autenticacao-jwt.md): autenticação com JWT.

---

## ⚙️ Como executar

### Pré-requisitos

- **Node.js 20+**
- **PostgreSQL 14+**: pode ser uma instalação local ou o container do [Docker](https://www.docker.com/) já configurado no projeto.

### Passo a passo

```bash
# 1. Instalar as dependências (o Prisma Client é gerado automaticamente)
npm install

# 2. Criar o arquivo de variáveis de ambiente
cp .env.example .env          # no Windows (PowerShell): copy .env.example .env

# 3. Subir o PostgreSQL (opcional, se já tiver um Postgres rodando na porta 5432)
docker compose up -d

# 4. Criar as tabelas no banco aplicando as migrations
npm run db:migrate

# 5. Iniciar a API
npm start                     # ou: npm run dev (reinicia ao salvar arquivos)
```

A API sobe em **http://localhost:3000**, e o front-end fica disponível no mesmo endereço.

> Se usar um PostgreSQL próprio, ajuste a `DATABASE_URL` no `.env` com o usuário, a senha e o nome do banco.

### Variáveis de ambiente

| Variável       | Descrição                                   |
|----------------|---------------------------------------------|
| `PORT`         | Porta HTTP da API (padrão `3000`)           |
| `DATABASE_URL` | String de conexão do PostgreSQL             |
| `JWT_SECRET`   | Chave usada para assinar os tokens JWT      |

A aplicação não inicia se `DATABASE_URL` ou `JWT_SECRET` estiverem ausentes.

### Scripts disponíveis

| Comando                  | O que faz                                              |
|--------------------------|--------------------------------------------------------|
| `npm start`              | Inicia a API                                           |
| `npm run dev`            | Inicia em modo watch                                   |
| `npm test`               | Executa os testes automatizados                        |
| `npm run db:migrate`     | Aplica as migrations no banco (`prisma migrate deploy`) |
| `npm run db:migrate:dev` | Cria uma nova migration após alterar o schema          |
| `npm run db:studio`      | Abre o Prisma Studio para visualizar os dados          |

---

## 🧪 Testes

```bash
npm test
```

- **Testes de unidade/HTTP** (rodam sem banco): autenticação JWT, validação de entrada, limites de upload, conversão de imagens para WebP e bloqueio de acesso ao código-fonte.
- **Testes de integração** (rodam automaticamente quando o PostgreSQL do `.env` está acessível e com as migrations aplicadas): cadastro e login, criação de restaurantes e pratos, regra de dono do restaurante, uploads e registro de atividades. Sem banco, eles aparecem como *skipped*.

---

## 📡 Endpoints

Rotas marcadas com 🔒 exigem o cabeçalho `Authorization: Bearer <token>`, obtido no login.

### Autenticação

| Método | Rota                  | Descrição                                          |
|--------|-----------------------|----------------------------------------------------|
| POST   | `/auth/register`      | Cadastra usuário: `{ name, email, password }` (senha ≥ 6 caracteres) |
| POST   | `/auth/login`         | Retorna `{ token, user }`: `{ email, password }`   |
| GET    | `/auth/me` 🔒         | Dados do usuário autenticado                       |
| GET    | `/auth/me/activities` 🔒 | Últimas 20 atividades do usuário                |
| POST   | `/auth/me/image` 🔒   | Upload do avatar (multipart, campo `image`)        |

### Restaurantes e pratos

| Método | Rota                                  | Descrição                                                   |
|--------|---------------------------------------|-------------------------------------------------------------|
| GET    | `/restaurants`                        | Lista restaurantes com seus pratos                          |
| POST   | `/restaurants` 🔒                     | Cria restaurante: `{ name, category, rating? }` (0 a 5)     |
| POST   | `/restaurants/:restaurantId/dishes` 🔒 | Cria prato: `{ name, category, price, description? }`. Somente o dono do restaurante |
| POST   | `/dishes/:dishId/image` 🔒            | Upload da foto do prato (multipart, campo `image`). Somente o dono do restaurante |

### Regras de upload

- Formatos aceitos: **JPEG, PNG e WebP**, com até **4 MB**.
- As imagens são redimensionadas para no máximo **800×800 px**, convertidas para **WebP** e servidas em `/uploads/...`.

### Códigos de resposta

| Status | Quando ocorre                                           |
|--------|---------------------------------------------------------|
| 400    | Dados inválidos, JSON malformado ou arquivo não suportado |
| 401    | Token ausente, inválido ou expirado / login incorreto   |
| 403    | Usuário não é o dono do restaurante                     |
| 404    | Restaurante, prato ou rota inexistente                  |
| 409    | E-mail já cadastrado                                    |
| 413    | Arquivo acima de 4 MB                                   |

Todas as respostas de erro seguem o formato `{ "error": "mensagem" }`.

### Exemplo rápido com `curl`

```bash
curl -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@email.com","password":"senha123"}'

curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"ana@email.com","password":"senha123"}'
# copie o "token" da resposta

curl -X POST http://localhost:3000/restaurants -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" -d '{"name":"Cantina da Ana","category":"Italiana","rating":4.8}'

curl -X POST http://localhost:3000/dishes/1/image -H "Authorization: Bearer SEU_TOKEN" \
  -F "image=@foto-do-prato.jpg"
```
