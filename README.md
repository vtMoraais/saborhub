# 🥗 SaborHub — API & Plataforma de Gestão Gastronômica

Projeto acadêmico desenvolvido em **Node.js**, **Express**, **Prisma ORM** e **PostgreSQL**, estruturado sob **Arquitetura em Camadas** com autenticação **JWT** e pipeline de otimização de imagens via **Multer + Sharp**.

---

## 🏗️ Arquitetura do Projeto

O fluxo de dados segue a separação de responsabilidades:
`Routes → Controller → Service → Database (Prisma)`

```text
src/
 ├── database/
 │    └── prisma.js                # Instância do PrismaClient
 ├── modules/
 │    ├── auth/                    # Registro, Login JWT e Upload de Avatar
 │    ├── restaurant/              # Listagem, Criação de Restaurantes e Pratos
 │    ├── dishes/                  # Upload otimizado de fotos dos pratos
 │    └── shared/                  # ImageService (Sharp -> WebP) e Multer
 └── app.js                        # Configuração de middlewares e rotas Express