import { createGameServer } from "./server";

const PORT = Number(process.env.PORT) || 4174;

const handle = await createGameServer({ port: PORT });
console.log(`XPath Arena server listening on port ${handle.port}`);
console.log(`  Local:   http://localhost:${handle.port}`);
console.log(`  LAN:     http://${handle.lanAddress}:${handle.port}`);
console.log(`  WS path: /ws`);
