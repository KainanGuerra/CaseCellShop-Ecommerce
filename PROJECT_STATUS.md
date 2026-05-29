# CaseCellShop — Status do Projeto

## Stack
- **Backend:** NestJS (TypeScript) — porta 3001
- **Frontend:** Nuxt 3 + Tailwind CSS — porta 3000
- **Banco:** PostgreSQL 16-alpine via Docker — porta 5433 (5432 ocupada por outro container)
- **ORM:** TypeORM (`synchronize: true` em dev)

---

## Estrutura de Pastas

```
/casecellshop/
├── docker-compose.yml        ← sobe o postgres
├── PROJECT_STATUS.md         ← este arquivo
├── backend/
│   ├── .env
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── config/
│   │   │   └── database.config.ts        (não usado — substituído por forRootAsync)
│   │   ├── common/
│   │   │   ├── exceptions/
│   │   │   │   ├── insufficient-stock.exception.ts   (409)
│   │   │   │   └── erp-processing.exception.ts       (vira 503)
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts          (global — diferencia todos os erros)
│   │   ├── database/
│   │   │   └── seed.service.ts           (OnModuleInit — 1 usuário + 6 produtos)
│   │   └── modules/
│   │       ├── users/
│   │       │   ├── user.entity.ts        (id, name, email, endereço completo em colunas)
│   │       │   ├── users.service.ts
│   │       │   ├── users.controller.ts   (GET /users/demo)
│   │       │   └── users.module.ts
│   │       ├── products/
│   │       │   ├── product.entity.ts     (id, name, description, price, stock_quantity, sku, image_url)
│   │       │   ├── products.service.ts   (findAll com ?search= e ?inStock=, findOne)
│   │       │   ├── products.controller.ts (GET /products, GET /products/:id)
│   │       │   └── products.module.ts
│   │       └── orders/
│   │           ├── order.entity.ts       (status enum: processing/confirmed/cancelled | payment_status: pending/paid/failed)
│   │           ├── order-item.entity.ts  (product_id, quantity, unit_price)
│   │           ├── erp.service.ts        (delay 1–4s + 30% de falha aleatória)
│   │           ├── orders.service.ts     (transação + SELECT FOR UPDATE + ERP + idempotência)
│   │           ├── orders.controller.ts  (POST /orders — retorna 201 novo / 200 replay)
│   │           ├── orders.module.ts
│   │           └── dto/
│   │               └── create-order.dto.ts (user_id UUID, idempotency_key string, items[])
└── frontend/
    ├── nuxt.config.ts        (módulo tailwind, runtimeConfig.public.apiBase)
    ├── tailwind.config.ts
    ├── app.vue
    ├── types/
    │   └── api.ts            (Product, OrderResponse, ApiError, ValidationDetail)
    ├── composables/
    │   └── useCheckout.ts    (máquina de estados: idle/loading/success/validation_error/stock_error/erp_error)
    ├── components/
    │   ├── ProductCard.vue   (card com imagem, preço, badge de estoque, link para checkout)
    │   └── StockBadge.vue    (verde "Em estoque (N)" / vermelho "Esgotado")
    ├── pages/
    │   ├── index.vue         (grid de produtos com skeleton loading)
    │   └── checkout/
    │       └── [id].vue      (seletor de quantidade, botão de compra, todos os estados de UI)
    └── assets/css/
        └── main.css
```

---

## O Que Foi Implementado

### Infraestrutura
- [x] `docker-compose.yml` com PostgreSQL 16-alpine (porta 5433)
- [x] `.env` do backend com variáveis de conexão
- [x] Backend NestJS scaffolado com `@nestjs/cli`
- [x] Frontend Nuxt 3 criado manualmente (nuxi CLI é interativo)
- [x] Dependências instaladas: `@nestjs/typeorm`, `typeorm`, `pg`, `class-validator`, `class-transformer`, `@nestjs/config`, `@nuxtjs/tailwindcss`

### Backend — Regras de Negócio
- [x] **Listagem de produtos** — `GET /products` com filtros `?search=` (ILIKE) e `?inStock=true`
- [x] **Produto individual** — `GET /products/:id`
- [x] **Usuário demo** — `GET /users/demo` (frontend usa para obter o `userId`)
- [x] **Criação de pedido** — `POST /orders` com fluxo completo:
  - Checagem prévia de idempotência (fora da transação — fast path)
  - `QueryRunner` + `startTransaction`
  - `SELECT ... FOR UPDATE` (lock pessimista) em cada produto
  - Validação de estoque — lança `InsufficientStockException` (409)
  - Decremento atômico do estoque
  - Criação do `Order` (PROCESSING/PENDING) + `OrderItems`
  - `commitTransaction`
  - Chamada ao `ErpService` (pós-commit, dentro do request HTTP — cliente espera)
  - Sucesso ERP → atualiza para CONFIRMED/PAID
  - Falha ERP → atualiza para CANCELLED/FAILED → lança `ErpProcessingException` (503)
- [x] **Idempotência** — coluna `idempotency_key UNIQUE` na tabela `orders`; frontend gera UUID por sessão de compra; retry gera novo UUID
- [x] **Simulação de ERP** — delay aleatório de 1–4s + 30% de chance de falha

### Backend — Infraestrutura de Código
- [x] `AllExceptionsFilter` global — mapeia: `ErpProcessingException→503`, `ValidationPipe→400 VALIDATION_ERROR`, `InsufficientStockException→409`, outros `HttpException` passam direto, desconhecidos→500
- [x] `ValidationPipe` global com `exceptionFactory` recursivo (resolve campos aninhados como `items.0.quantity`)
- [x] CORS habilitado para `http://localhost:3000`
- [x] `SeedService` (`OnModuleInit`) — cria 1 usuário demo + 6 produtos (um deles com `stock_quantity: 0`)
- [x] `TypeOrmModule.forRootAsync` com `ConfigService` (evita race condition de leitura do `.env` antes do módulo inicializar)

### Frontend — UI
- [x] Página `/` — grid de produtos com skeleton loading, estado de erro se API offline
- [x] Página `/checkout/:id` — busca produto + usuário demo, seletor de quantidade (min/max respeitados), botão com spinner
- [x] **Previne múltiplos cliques** — botão desabilitado enquanto `state.type === 'loading'`
- [x] **Mensagens por estado:**
  - Sucesso: "Pedido confirmado! 🎉" + orderId
  - Erro de validação: lista de campos com mensagens
  - Estoque insuficiente: "Apenas N unidades disponíveis"
  - Falha ERP: "Falha temporária" + botão "Tentar novamente"
- [x] **Retry** gera novo `idempotency_key` (UUID) sem recarregar a página

### Seed — Produtos
| Produto                              | SKU            | Preço    | Estoque |
|--------------------------------------|----------------|----------|---------|
| Capinha MagSafe iPhone 15 Pro        | CAP-IP15P-001  | R$ 89    | 40      |
| Capinha Anti-impacto Galaxy S24      | CAP-S24-001    | R$ 69    | 35      |
| Película Vidro Temperado iPhone 15   | PEL-IP15-001   | R$ 34    | 80      |
| Carregador Wireless 15W Qi2          | CAR-WL-001     | R$ 149   | 20      |
| Suporte Veicular Magnético           | SUP-VEI-001    | R$ 59    | 50      |
| Cabo USB-C para USB-C 2m Nylon       | CAB-USBC-001   | R$ 44    | **0**   |

---

## Como Rodar

```bash
# 1. Subir o banco
docker compose up -d

# 2. Backend (em um terminal separado)
cd backend && npm run start:dev

# 3. Frontend (em outro terminal)
cd frontend && npm run dev
```

URLs: frontend em http://localhost:3000 | API em http://localhost:3001

---

## Decisão de Design — Estoque em Falha de ERP

Atualmente, o estoque é decrementado na transação **antes** da chamada ao ERP.
Se o ERP falhar, o pedido vai para CANCELLED/FAILED mas o estoque **não é restaurado**.

Isso é intencional (reserva de estoque), mas pode ser mudado se o negócio exigir restauração.

---

## Tasks Pendentes / Melhorias

### Alta Prioridade
- [x] **Dockerfiles para backend e frontend** — `Dockerfile` multi-stage para ambos; `docker-compose.yml` com serviços `backend` e `frontend`; composable `useApiBase` resolve URL interna (SSR/Docker) vs pública (browser)
- [ ] **Restaurar estoque em falha de ERP** — `order.status = CANCELLED` deveria fazer `product.stock_quantity += quantity` dentro de uma nova transação
- [x] **Variável de ambiente no frontend** — `frontend/.env` com `NUXT_PUBLIC_API_BASE=http://localhost:3001`; `nuxt.config.ts` lê `NUXT_API_BASE` (server-side) e `NUXT_PUBLIC_API_BASE` (browser)

### Qualidade / Robustez
- [ ] **Testes unitários** — `orders.service.spec.ts` cobrindo: sucesso, estoque insuficiente, idempotência, falha ERP
- [ ] **Testes e2e** — fluxo completo via Supertest
- [ ] **Rate limiting** — `@nestjs/throttler` no `POST /orders` para evitar spam
- [ ] **Paginação** — `GET /products?page=&limit=` com `TypeORM` skip/take
- [ ] **Timeout no ERP** — atualmente o ERP pode travar indefinidamente; adicionar `Promise.race` com timeout de 10s
- [ ] **Restaurar conexão DB** — configurar `retryAttempts` e `retryDelay` no `TypeOrmModule`

### Features Extras
- [x] **`GET /orders/:userId`** — histórico de pedidos do usuário
- [ ] **Campo `quantity` mínimo dinâmico** — frontend já usa `stock_quantity` como max, mas o backend não valida se o produto existe antes da transação (apenas dentro dela)
- [ ] **Swagger / OpenAPI** — `@nestjs/swagger` com decoradores nos DTOs e controllers
- [ ] **Autenticação básica** — JWT simples (login com e-mail) para substituir o usuário demo fixo
- [ ] **Imagens reais** — atualmente usa `picsum.photos` (placeholder); integrar upload ou CDN

### Infraestrutura / Deploy
- [x] **`docker-compose.yml` completo** — inclui serviços `backend` e `frontend` com build, depends_on e restart policy
- [ ] **`.env.example`** — arquivo de exemplo para todas as variáveis de ambiente
- [ ] **CI/CD básico** — GitHub Actions: lint + testes + build
- [ ] **Logging estruturado** — substituir `console.log` por logger JSON para produção (ex: `pino`)
