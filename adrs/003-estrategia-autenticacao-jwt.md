# ADR 003: Definição da Estratégia de Autenticação (JWT vs Alternativas)

- **Status:** Aceito
- **Data:** Outubro de 2026

## Contexto
Para proteger a criação de restaurantes, cadastro de pratos e upload de imagens de perfil (`POST /auth/me/image`), o sistema necessita de um mecanismo de autenticação stateless.

## Alternativas Pesquisadas
1. **JSON Web Token (JWT) + Bcryptjs (Implementação Própria):** Tokens assinados digitalmente pelo backend, sem custo externo e sem dependência de provedores terceiros.
2. **AWS Cognito:** Serviço gerenciado robusto, porém adiciona complexidade de configuração de conta AWS, IAM e custos após a camada gratuita.
3. **Google OAuth 2.0 (Social Login):** Excelente experiência para o usuário final, mas exige credenciais no Google Cloud Console e fluxo de redirecionamento no front-end.

## Decisão e Justificativa
Adotamos **JWT (JSON Web Token)** combinado com **Bcryptjs** para hash de senhas no módulo `src/modules/auth/`.
- **Autonomia e Portabilidade:** Qualquer avaliador consegue clonar o repositório e testar o fluxo completo (`/auth/register` e `/auth/login`) apenas definindo a variável `JWT_SECRET` no `.env`, sem precisar criar chaves na AWS ou no Google Cloud.
- **Padrão Stateless:** O middleware `auth.middleware.js` valida o cabeçalho `Authorization: Bearer <token>` e injeta `req.user`, protegendo as rotas de escrita e de upload de imagens.