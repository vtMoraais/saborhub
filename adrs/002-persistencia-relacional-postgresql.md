# ADR 002: Adoção do PostgreSQL com Prisma ORM para Persistência

- **Status:** Aceito
- **Data:** Setembro de 2026
- **Substitui:** ADR 001

## Contexto
Para superar a perda de dados ao reiniciar o servidor (identificada na ADR 001) e suportar o relacionamento entre **Usuários**, **Restaurantes** e **Pratos**, tornou-se necessário selecionar um banco de dados relacional ou não-relacional e definir o impacto nas rotas `GET /restaurants` e `POST /restaurants`.

## Opções Avaliadas
1. **PostgreSQL + Prisma ORM:** Banco relacional robusto, suporte a transações ACID, tipagem estrita e controle de versão de schema via migrations.
2. **SQLite:** Simples de configurar em arquivo local, porém limitado para concorrência em produção.
3. **MongoDB:** Orientado a documentos; menos indicado aqui devido à forte relação estruturada (`User 1:N Restaurant 1:N Dish`).

## Decisão e Justificativa
Escolhemos o **PostgreSQL** integrado via **Prisma ORM** (`src/database/prisma.js`). 
- Garante integridade referencial com `onDelete: Cascade` entre restaurantes e seus pratos.
- O fluxo arquitetural passa a seguir rigorosamente: `Routes -> Controller -> Service -> Prisma (Database)`.
- No `GET /restaurants`, o método `prisma.restaurant.findMany({ include: { dishes: true } })` retorna os estabelecimentos já hidratados com seus cardápios.
- No `POST /restaurants`, o método `prisma.restaurant.create()` persiste os dados em disco de forma definitiva.