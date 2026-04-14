# Configuração do Banco de Dados

## Solução: Turso (SQLite na Nuvem)

Este projeto usa **Turso**, que é SQLite distribuído na nuvem. É leve, simples e funciona perfeitamente com Vercel/serverless.

### Por que Turso?

✅ **SQLite familiar** - Mesma sintaxe e simplicidade  
✅ **Gratuito** - Plano free generoso  
✅ **Serverless-friendly** - Funciona perfeitamente na Vercel  
✅ **Rápido** - Baixa latência  
✅ **Simples** - Sem configuração complexa

## Setup

### 1. Criar conta e banco no Turso

1. Acesse [https://turso.tech](https://turso.tech) e crie uma conta
2. Instale o CLI: `curl -sSfL https://get.tur.so/install.sh | bash`
3. Autentique: `turso auth login`
4. Crie o banco: `turso db create nome-do-seu-banco`
5. Obtenha a connection string: `turso db show nome-do-seu-banco`
6. Crie um token: `turso db tokens create nome-do-seu-banco`

### 2. Configuração

#### Desenvolvimento Local

No arquivo `.env`:

```env
DATABASE_URL="file:./dev.db"
```

#### Produção (Vercel)

No painel da Vercel, adicione:

```env
DATABASE_URL="libsql://nome-do-banco-xxxxx.turso.io?authToken=seu-token"
```

O Prisma automaticamente detecta se é SQLite local ou Turso pela URL.

Veja o arquivo `README-TURSO.md` para instruções detalhadas.

## Migrations

### Desenvolvimento

```bash
npm run db:migrate
```

### Produção (Vercel)

A Vercel executa automaticamente `prisma migrate deploy` durante o build se detectar migrations.

Ou execute manualmente:

```bash
npx prisma migrate deploy
```

## Gerar Prisma Client

```bash
npm run db:generate
```

## Visualizar Dados (Prisma Studio)

```bash
npm run db:studio
```
