# Configuração do Banco de Dados com Turso

## O que é Turso?

Turso é SQLite distribuído na nuvem. É leve, simples e funciona perfeitamente com Vercel/serverless, mantendo toda a simplicidade do SQLite.

## Setup Inicial

### 1. Criar conta no Turso

1. Acesse [https://turso.tech](https://turso.tech)
2. Crie uma conta gratuita
3. Crie um novo banco de dados

### 2. Instalar CLI do Turso

```bash
# macOS/Linux
curl -sSfL https://get.tur.so/install.sh | bash

# Windows (via Scoop)
scoop install turso

# Ou via npm
npm install -g @libsql/client
```

### 3. Autenticar no Turso

```bash
turso auth login
```

### 4. Criar banco de dados

```bash
turso db create nome-do-seu-banco
```

### 5. Obter connection string

```bash
turso db show nome-do-seu-banco
```

Você receberá algo como:

```
libsql://nome-do-seu-banco-xxxxx.turso.io
```

### 6. Criar token de acesso

```bash
turso db tokens create nome-do-seu-banco
```

## Configuração no Projeto

### Desenvolvimento Local

No arquivo `.env`:

```env
# Para desenvolvimento local (SQLite local)
DATABASE_URL="file:./dev.db"
```

### Produção (Vercel)

No painel da Vercel, adicione a variável de ambiente:

```env
DATABASE_URL="libsql://nome-do-seu-banco-xxxxx.turso.io?authToken=seu-token-aqui"
```

**Formato completo da URL:**

```
libsql://[database-name]-[org-name].turso.io?authToken=[token]
```

## Migrations

### Desenvolvimento

```bash
npm run db:migrate
```

### Produção

```bash
# Usar a connection string do Turso
DATABASE_URL="libsql://..." npx prisma migrate deploy
```

Ou configure no build da Vercel para executar automaticamente.

## Vantagens do Turso

✅ **SQLite familiar** - Mesma sintaxe e simplicidade  
✅ **Gratuito** - Plano free generoso  
✅ **Serverless-friendly** - Funciona perfeitamente na Vercel  
✅ **Rápido** - Baixa latência  
✅ **Simples** - Sem configuração complexa

## Alternativa: SQLite Local (apenas desenvolvimento)

Se quiser usar SQLite local apenas para desenvolvimento:

```env
# .env (desenvolvimento)
DATABASE_URL="file:./dev.db"
```

E no Turso para produção, a Vercel automaticamente usará a variável de ambiente configurada.

## Comandos Úteis

```bash
# Listar bancos
turso db list

# Ver informações do banco
turso db show nome-do-banco

# Criar novo token
turso db tokens create nome-do-banco

# Ver tokens existentes
turso db tokens list nome-do-banco

# Abrir shell SQL
turso db shell nome-do-banco
```
