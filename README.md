This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

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

## Chat System

The application includes a real-time chat system for servers, organized into categories similar to Discord.

### Features
- Real-time messaging using Server-Sent Events (SSE)
- Category-based organization of messages
- Notifications for users with favorite servers or collection subscriptions
- Lazy loading of messages with pagination

### Setup

To set up the chat system, run the setup script:

```bash
node scripts/setup-chat.js
```

This will create the necessary categories and seed sample messages.

For more information, see the [chat system documentation](docs/chat-system.md)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Docker Deployment

You can deploy this application using Docker:

### Building the Docker Image

```bash
docker build -t server-lister .
```

### Running the Container with Docker Compose

A `docker-compose.yml` file is provided to easily run the application with PostgreSQL and Redis:

```bash
docker-compose up -d
```

This will start:
- A PostgreSQL database container
- A Redis container for job queues and caching
- The application container

The application will be available at http://localhost:3000

### Environment Variables

The application requires the following environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`: PostgreSQL user
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_PORT`: PostgreSQL port
- `REDIS_URL`: Redis connection string
- `REDIS_USER`: Redis user (if applicable)
- `REDIS_PASSWORD`: Redis password (if applicable)

These can be set in a `.env` file for local development, or in the Docker Compose file for Docker deployment.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
