# CaseCellShop

E-commerce fullstack de capinhas e acessórios de celular construído com **NestJS**, **Nuxt 3**, **PostgreSQL** e **Tailwind CSS** — com controle de estoque concorrente, prevenção de pedido duplicado e simulação de ERP instável.

---

## O que foi construído

### Backend — NestJS + TypeORM + PostgreSQL

- **Listagem de produtos** com paginação (`?page=&limit=`), busca textual (`?search=`) e filtro de disponibilidade (`?inStock=true`)
- **Detalhamento de produto** via `GET /products/:id`
- **Criação de pedido** (`POST /orders`) com fluxo transacional completo:
  - Checagem de idempotência fora da transação (*fast path*)
  - `QueryRunner` + `SELECT ... FOR UPDATE` (lock pessimista por produto)
  - Decremento atômico de estoque dentro da transação
  - Criação de `Order` + `OrderItems` e commit
  - Chamada síncrona ao ERP após o commit — o cliente aguarda
  - Status final determinado pela resposta do ERP
- **Simulação de ERP instável** — delay aleatório de 1 a 4 s + 30 % de chance de falha
- **Filtro global de exceções** (`AllExceptionsFilter`) — mapeia cada tipo de erro ao código HTTP e payload corretos
- **ValidationPipe global** com resolução recursiva de campos aninhados (ex: `items.0.quantity`)
- **SeedService** (`OnModuleInit`) — cria automaticamente 1 usuário demo e 6 produtos na primeira inicialização, incluindo um produto com estoque zerado
- **CORS** configurado para o frontend em `http://localhost:3000`

### Frontend — Nuxt 3 + Tailwind CSS

- **Catálogo paginado** com skeleton loading e estado de erro caso a API esteja offline
- **Carrinho de compras** persistido via `useState` com controle de quantidade por item (respeitando o estoque máximo)
- **Fluxo de checkout** com stepper visual de 4 etapas mostrando o progresso em tempo real
- **Página de pedidos** (`/pedidos`) com histórico completo do usuário
- **Máquina de estados no composable `useCheckout`** — cada resposta da API leva a um estado distinto com mensagem clara para o usuário
- **Badge de estoque** dinâmico: verde "Em estoque (N)" / vermelho "Esgotado"
- **Botão de retry** que gera um novo `idempotency_key` sem recarregar a página

---

## Como rodar o projeto

### Pré-requisitos

- [Node.js](https://nodejs.org) v18+
- [Docker](https://www.docker.com) + Docker Compose

### Passo 1 — Banco de dados

```bash
docker compose up -d
```

Sobe o PostgreSQL 16 na porta **5433** e o pgAdmin em **http://localhost:5050** (admin@admin.com / password).

### Passo 2 — Backend

```bash
cd backend
npm install
npm run start:dev
```

Na primeira inicialização o seed roda automaticamente: 1 usuário demo + 6 produtos criados.

API disponível em **http://localhost:3001**

### Passo 3 — Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm run dev
```

App disponível em **http://localhost:3000**

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/products` | Lista produtos (`?page=` `?limit=` `?search=` `?inStock=true`) |
| GET | `/products/:id` | Detalhe de um produto |
| GET | `/users/demo` | Retorna o usuário demo |
| GET | `/orders/user/:userId` | Histórico de pedidos do usuário |
| POST | `/orders` | Cria uma tentativa de compra |

### POST /orders

```json
{
  "user_id": "uuid-do-usuario",
  "idempotency_key": "uuid-unico-por-tentativa",
  "items": [
    { "product_id": "uuid-do-produto", "quantity": 2 }
  ]
}
```

| HTTP | Código de erro | Situação |
|------|----------------|----------|
| 201 | — | Pedido criado com sucesso |
| 200 | — | Replay idempotente (chave já usada) |
| 400 | `VALIDATION_ERROR` | Dados inválidos |
| 409 | `INSUFFICIENT_STOCK` | Estoque insuficiente |
| 503 | `ERP_FAILURE` | Falha temporária no ERP |

---

## Estratégia de status

Cada pedido carrega dois campos de status que evoluem de forma independente:

```
OrderStatus     : processing → confirmed | cancelled
PaymentStatus   : pending    → paid      | failed
```

**Ciclo de vida:**

1. Ao entrar na transação o pedido nasce como `PROCESSING / PENDING`
2. Após o commit (estoque já decrementado) o ERP é chamado de forma síncrona
3. Se o ERP confirmar → `CONFIRMED / PAID`
4. Se o ERP falhar → `CANCELLED / FAILED` e o cliente recebe 503

A separação em dois enums permite que o domínio expresse com precisão "pedido cancelado por falha de pagamento" sem colapsar as duas dimensões em um único campo. O estoque decrementado na transação **não é restaurado** em caso de falha do ERP — trata-se de uma reserva intencional; o item permanece indisponível até intervenção manual ou reprocessamento.

---

## Estratégia de prevenção de duplicidade

O cenário crítico é o produto com **apenas 1 unidade em estoque**: dois clientes simultâneos no checkout, ambos enviando a compra ao mesmo tempo.

A solução usa duas camadas complementares:

### Camada 1 — Idempotency key (duplicidade de clique)

O frontend gera um `crypto.randomUUID()` no momento em que a página de carrinho é aberta. Esse UUID é enviado como `idempotency_key` em cada tentativa. A coluna `idempotency_key` na tabela `orders` tem restrição `UNIQUE`.

- Se o mesmo clique chegar duas vezes (rede instável, duplo clique), o banco rejeita o segundo `INSERT` silenciosamente e o backend retorna o pedido já existente com HTTP 200.
- O botão de checkout fica desabilitado enquanto `state.type === 'loading'`, impedindo cliques extras na mesma sessão.
- Ao clicar em "Tentar novamente" após falha, o frontend gera um **novo** UUID — garantindo que a nova tentativa seja tratada como um pedido independente.

### Camada 2 — SELECT FOR UPDATE (concorrência real entre usuários)

Para o caso de dois usuários distintos disputando o último item:

```
Usuário A                         Usuário B
   │                                  │
   ├── SELECT ... FOR UPDATE ──────►  │ (bloqueado, aguarda lock)
   ├── stock = 1, ok                  │
   ├── stock -= 1 → 0                 │
   ├── COMMIT                         │
   │                              ◄───┤ (lock liberado)
   │                                  ├── SELECT ... FOR UPDATE
   │                                  ├── stock = 0  →  InsufficientStockException
   │                                  └── ROLLBACK → HTTP 409
```

O `QueryRunner` do TypeORM adquire o lock pessimista com `{ mode: 'pessimistic_write' }` em cada linha de produto **dentro da transação**. Isso garante que a leitura do estoque e o decremento sejam atômicos: não existe janela de tempo entre "verificar" e "decrementar" onde outro pedido possa entrar.

O usuário B recebe um 409 com `{ available: 0 }` e o frontend exibe a mensagem adequada.

---

## Variáveis de ambiente

`backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=casecell_user
DB_PASSWORD=casecell_password
DB_NAME=casecell_db
PORT=3001
FRONTEND_URL=http://localhost:3000
```
