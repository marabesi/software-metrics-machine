This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Software Metrics Dashboard

This Next.js application provides a comprehensive dashboard for analyzing software metrics including:
- **Source Code Metrics**: Pairing index, code churn, coupling, entity effort
- **Pipeline Metrics**: CI/CD runs, job status, deployment frequency
- **Pull Request Metrics**: Review times, author contributions, PR trends

The dashboard consumes a REST API running at `http://localhost:8000`.

For detailed migration notes and architecture, see [DASHBOARD_MIGRATION.md](./DASHBOARD_MIGRATION.md).

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Default configuration:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Ensure API is Running

The dashboard requires the FastAPI backend to be running:

```bash
# In another terminal, navigate to the api directory and start the server
# Make sure it's running on port 8000
```

### 4. Run Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
