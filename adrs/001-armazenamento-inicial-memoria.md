# ADR 001: Uso de Estrutura em Memória na Fase de Prototipação

- **Status:** Substituído (ver ADR 002)
- **Data:** Agosto de 2026
- **Contexto Acadêmico:** Etapa 1 — Construção das rotas iniciais (`GET /restaurants` e `POST /restaurants`)

## Contexto e Problema
No início do desenvolvimento da API **SaborHub**, o objetivo principal consistia em validar o contrato HTTP das rotas de listagem e criação de restaurantes utilizando Node.js e Express na porta 3000. Era necessário decidir como armazenar os registros antes de acoplar uma camada de infraestrutura externa.

## Decisão
Utilizar um **Array em memória RAM** (`const restaurants = []`) diretamente no módulo inicial para armazenar os objetos durante a execução do processo Node.js.

## Limitações Observadas nos Testes de Reinicialização
Ao testar o comportamento do servidor com `POST /restaurants` seguido de reinicialização do processo Node.js:
1. **Volatilidade Total:** Todos os restaurantes cadastrados via `POST` são perdidos assim que o processo é encerrado ou reiniciado.
2. **Isolamento de Processo:** Impossibilita escalar horizontalmente a aplicação, pois cada instância teria seu próprio array isolado.
3. **Ausência de Integridade Relacional:** Não há garantia de chave estrangeira para associar usuários proprietários (`ownerId`) e pratos (`dishes`).

## Conclusão
O array em memória cumpriu seu papel na validação rápida dos endpoints HTTP, mas a evolução para uma arquitetura em camadas exige a adoção imediata de um SGBD relacional (documentado na ADR 002).