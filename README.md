# XPath Arena

A game for practicing and competing with XPath queries.

## Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- npm

## Setup

Install dependencies for all workspaces (client, server, and shared packages):

```bash
npm install
```

## Running the app

Start the client (Vite dev server):

```bash
npm run dev
```

Start the game server (WebSocket/HTTP server):

```bash
npm run dev:server
```

Or start both at once:

```bash
npm run dev:all
```

The client runs at `http://localhost:5173` by default, and the server listens on port `4174` (override with the `PORT` env var).

## Other useful commands

```bash
npm run build      # build all packages and apps
npm test           # run unit tests (vitest)
npm run test:e2e   # run end-to-end tests (playwright)
npm run typecheck  # type-check the whole project
```
