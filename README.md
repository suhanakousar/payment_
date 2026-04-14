## Payment Aggregator Platform

This project uses Next.js, Prisma, and PostgreSQL.

## Local database setup

1. Start PostgreSQL:

```bash
docker compose up -d postgres
```

2. Generate the Prisma client:

```bash
npx prisma generate
```

3. Create the database tables from the Prisma schema:

```bash
npx prisma db push
```

If you want Prisma migration files instead of a direct schema push, run:

```bash
npx prisma migrate dev --name init
```

The local default connection string is stored in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/payment_platform?schema=public"
```

## Useful commands

```bash
npm run dev
npm run prisma:generate
npm run db:push
npm run db:migrate
npm run db:studio
```
