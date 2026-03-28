const express = require("express");
const path = require("path");
const http = require("http");
const { randomUUID } = require("crypto");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Datastore = require("nedb-promises");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT || 3002);
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const TILE = 32;
const WORLD_WIDTH = 240;
const WORLD_HEIGHT = 90;
const INVENTORY_STACK_LIMIT = 99;
const MAX_HEALTH = 100;
const PUNCH_DAMAGE = 20;
const PUNCH_RANGE = TILE * 2.25;
const PUNCH_COOLDOWN_MS = 320;
const KNOCKBACK_PUSH = 420;
const KNOCKBACK_LIFT = -260;

const app = express();
const server = http.createServer(app);

app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });

const usersDB = Datastore.create({ filename: path.join(dataDir, "users.db"), autoload: true });
const worldDB = Datastore.create({ filename: path.join(dataDir, "world_blocks.db"), autoload: true });
const profilesDB = Datastore.create({ filename: path.join(dataDir, "profiles.db"), autoload: true });
const growingPlantsDB = Datastore.create({ filename: path.join(dataDir, "growing_plants.db"), autoload: true });
const inventoriesDB = Datastore.create({ filename: path.join(dataDir, "inventories.db"), autoload: true });

usersDB.ensureIndex({ fieldName: "username", unique: true });
worldDB.ensureIndex({ fieldName: "key", unique: true });
profilesDB.ensureIndex({ fieldName: "profileId", unique: true });
growingPlantsDB.ensureIndex({ fieldName: "key", unique: true });
inventoriesDB.ensureIndex({ fieldName: "key", unique: true });

let nextUserId = 1;
const worldCache = new Map();
const worldDrops = new Map(); // worldName -> Map(dropId, drop)

const INVENTORY_KEYS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14];

function defaultInventory() {
  const inv = {};
  INVENTORY_KEYS.forEach((k) => { inv[k] = 0; });
  return inv;
}

function sanitizeInventory(input) {
  const inv = defaultInventory();
  if (!input || typeof input !== "object") return inv;
  for (const key of INVENTORY_KEYS) {
    const val = Number(input[key]);
    if (Number.isFinite(val) && val >= 0) {
      inv[key] = Math.min(INVENTORY_STACK_LIMIT, Math.floor(val));
    }
  }
  return inv;
}

function blockKey(worldName, x, y) {
  return `${worldName}:${x}:${y}`;
}

function plantKey(worldName, x, y) {
  return `${worldName}:plant:${x}:${y}`;
}

function profileKey(userId, worldName) {
  return `${userId}:${worldName}`;
}

function inventoryKey(userId) {
  return `${userId}:inventory`;
}

function getWorldDrops(worldName) {
  if (!worldDrops.has(worldName)) {
    worldDrops.set(worldName, new Map());
  }
  return worldDrops.get(worldName);
}

async function initStores() {
  const users = await usersDB.find({});
  for (const user of users) {
    if (typeof user.id === "number" && user.id >= nextUserId) {
      nextUserId = user.id + 1;
    }
  }
}

function createToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function authFromHeader(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  usersDB.findOne({ id: payload.sub }).then((user) => {
    if (!user) {
      res.status(401).json({ error: "Invalid token" });
      return;
    }
    req.user = { id: user.id, username: user.username };
    next();
  }).catch(() => {
    res.status(500).json({ error: "Auth lookup failed" });
  });
}

function indexOf(x, y) {
  return y * WORLD_WIDTH + x;
}

function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);

function pseudoNoise(x) {
  return Math.sin(x * 0.14) * 0.55 + Math.sin(x * 0.047 + 23) * 0.3 + Math.sin(x * 0.008 + 60) * 0.15;
}

function generateWorld(world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT)) {
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    const base = 46;
    const height = Math.floor(base + pseudoNoise(x) * 10);

    for (let y = 0; y < WORLD_HEIGHT; y += 1) {
      if (y < height) world[indexOf(x, y)] = 0;
      else if (y === height) world[indexOf(x, y)] = 1;
      else if (y < height + 4) world[indexOf(x, y)] = 2;
      else world[indexOf(x, y)] = 3;
    }

    if (x % 29 === 0) {
      const cloudY = 15 + (x % 7);
      for (let i = 0; i < 5; i += 1) {
        if (inBounds(x + i, cloudY)) world[indexOf(x + i, cloudY)] = 5;
      }
    }

    if (x % 37 === 0 && x > 10 && x < WORLD_WIDTH - 10) {
      const trunkBase = height - 1;
      for (let t = 1; t <= 4; t += 1) {
        if (inBounds(x, trunkBase - t)) world[indexOf(x, trunkBase - t)] = 4;
      }
      if (inBounds(x - 1, trunkBase - 4)) world[indexOf(x - 1, trunkBase - 4)] = 1;
      if (inBounds(x + 1, trunkBase - 4)) world[indexOf(x + 1, trunkBase - 4)] = 1;
      if (inBounds(x, trunkBase - 5)) world[indexOf(x, trunkBase - 5)] = 1;
    }
  }

  // Place main door at world center for spawn/exit
  const doorX = Math.floor(WORLD_WIDTH / 2);
  const doorBaseY = 46 + Math.floor(pseudoNoise(doorX) * 10);
  world[indexOf(doorX, doorBaseY)] = 7;

  return world;
}

async function applyPersistedBlocks(worldName, world) {
  const rows = await worldDB.find({ worldName });
  for (const row of rows) {
    if (inBounds(row.x, row.y)) {
      world[indexOf(row.x, row.y)] = row.tile;
    }
  }
}

(() => {
  const defaultWorld = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
  generateWorld(defaultWorld);
  worldCache.set("default", { array: defaultWorld, loaded: false });
})();

app.post("/api/register", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      return res.status(400).json({ error: "Username must be 3-24 chars and alphanumeric/underscore" });
    }
    if (password.length < 6 || password.length > 64) {
      return res.status(400).json({ error: "Password must be 6-64 characters" });
    }

    const existing = await usersDB.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: nextUserId,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    nextUserId += 1;

    await usersDB.insert(user);

    const token = createToken(user);
    return res.json({ token, username: user.username });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ error: "Registration failed: " + (error.message || "Unknown error") });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await usersDB.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user);
    return res.json({ token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Login failed: " + (error.message || "Unknown error") });
  }
});

app.get("/api/me", authFromHeader, (req, res) => {
  return res.json({ id: req.user.id, username: req.user.username });
});

app.use(express.static(__dirname));

const wss = new WebSocketServer({ server, path: "/ws" });
const players = new Map();
const worldPlayers = new Map();

function getOrCreateWorldArray(worldName) {
  if (!worldCache.has(worldName)) {
    const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
    generateWorld(world);
    worldCache.set(worldName, { array: world, loaded: false });
  }
  return worldCache.get(worldName).array;
}

function broadcast(message, exceptId = null, worldName = null) {
  const payload = JSON.stringify(message);
  for (const [id, player] of players.entries()) {
    if (worldName && player.worldName !== worldName) continue;
    if (exceptId && id === exceptId) continue;
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(payload);
    }
  }
}

function parseTokenFromRequest(req) {
  const requestUrl = new URL(req.url, "http://localhost");
  const token = requestUrl.searchParams.get("token");
  const worldName = String(requestUrl.searchParams.get("world") || "default").slice(0, 24);
  if (!token) throw new Error("Missing token");
  return { token: verifyToken(token), worldName };
}

function distance(a, b) {
  const ax = a.x + 12;
  const ay = a.y + 22;
  const bx = b.x + 12;
  const by = b.y + 22;
  return Math.hypot(ax - bx, ay - by);
}

wss.on("connection", async (ws, req) => {
  let userPayload;
  let user;
  let worldName;
  try {
    const parsed = parseTokenFromRequest(req);
    userPayload = parsed.token;
    worldName = parsed.worldName;
    user = await usersDB.findOne({ id: userPayload.sub });
    if (!user) throw new Error("Unknown user");
  } catch {
    ws.send(JSON.stringify({ type: "error", error: "Unauthorized websocket" }));
    ws.close();
    return;
  }

  const playerId = randomUUID();
  const profileId = profileKey(user.id, worldName);
  const doorX = Math.floor(WORLD_WIDTH / 2);
  const doorBaseY = 46 + Math.floor(pseudoNoise(doorX) * 10);
  const doorSpawnX = doorX * TILE;
  const doorSpawnY = doorBaseY * TILE;
  const profile = await profilesDB.findOne({ profileId }) || {};
  const invDoc = await inventoriesDB.findOne({ key: inventoryKey(user.id) });
  const userInventory = sanitizeInventory(invDoc?.inventory);
  const player = {
    id: playerId,
    userId: user.id,
    username: user.username,
    worldName,
    x: doorSpawnX,
    y: doorSpawnY,
    facing: 1,
    health: MAX_HEALTH,
    maxHealth: MAX_HEALTH,
    lastPunchAt: 0,
    ws,
  };

  players.set(playerId, player);
  if (!worldPlayers.has(worldName)) worldPlayers.set(worldName, []);
  worldPlayers.get(worldName).push(playerId);

  const world = getOrCreateWorldArray(worldName);
  const worldCache_entry = worldCache.get(worldName);
  if (!worldCache_entry.loaded) {
    await applyPersistedBlocks(worldName, world);
    worldCache_entry.loaded = true;
  }

  const others = [];
  for (const [id, p] of players.entries()) {
    if (id === playerId || p.worldName !== worldName) continue;
    others.push({
      id: p.id,
      username: p.username,
      x: p.x,
      y: p.y,
      facing: p.facing,
      health: p.health,
      maxHealth: p.maxHealth,
    });
  }

  // Load growing plants for this world
  const growingPlants = await growingPlantsDB.find({ worldName });
  console.log(`[${worldName}] Loading ${growingPlants.length} growing plants for ${player.username}`);
  const plantsList = growingPlants.map(p => ({
    x: p.x,
    y: p.y,
    sourceBlock: p.sourceBlock,
    dropCount: p.dropCount,
    totalTime: p.totalTime,
    plantedAt: p.plantedAt,
    fullGrown: p.fullGrown
  }));

  ws.send(JSON.stringify({
    type: "init",
    id: player.id,
    username: player.username,
    worldName,
    player: { x: player.x, y: player.y, health: player.health, maxHealth: player.maxHealth },
    players: others,
    world: Array.from(world),
    inventory: userInventory,
    plants: plantsList,
    drops: Array.from(getWorldDrops(worldName).values())
  }));

  broadcast({
    type: "player_join",
    player: {
      id: player.id,
      username: player.username,
      x: player.x,
      y: player.y,
      facing: player.facing,
      health: player.health,
      maxHealth: player.maxHealth,
    },
  }, player.id, worldName);

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === "player_move") {
      if (typeof msg.x !== "number" || typeof msg.y !== "number") return;
      player.x = msg.x;
      player.y = msg.y;
      player.facing = msg.facing === -1 ? -1 : 1;
      // Do not change spawn position; players always spawn at door
      await profilesDB.update(
        { profileId },
        { profileId, userId: player.userId, worldName },
        { upsert: true }
      );
      broadcast({
        type: "player_move",
        id: player.id,
        username: player.username,
        x: player.x,
        y: player.y,
        facing: player.facing,
        health: player.health,
      }, player.id, worldName);
      return;
    }

    if (msg.type === "inventory_update") {
      const inv = sanitizeInventory(msg.inventory);
      await inventoriesDB.update(
        { key: inventoryKey(player.userId) },
        { key: inventoryKey(player.userId), userId: player.userId, inventory: inv, updatedAt: new Date().toISOString() },
        { upsert: true }
      );
      return;
    }

    if (msg.type === "punch_player") {
      const targetId = String(msg.targetId || "");
      const target = players.get(targetId);
      if (!target || target.id === player.id || target.worldName !== worldName) return;

      const now = Date.now();
      if (now - player.lastPunchAt < PUNCH_COOLDOWN_MS) return;
      if (distance(player, target) > PUNCH_RANGE) return;

      player.lastPunchAt = now;
      broadcast({ type: "punch", id: player.id, targetId: target.id }, null, worldName);

      const dx = (target.x + 12) - (player.x + 12);
      const sign = dx === 0 ? player.facing : Math.sign(dx);
      const knockVX = sign * KNOCKBACK_PUSH;
      const knockVY = KNOCKBACK_LIFT;
      const nudgeX = sign * 26;
      const nudgeY = -8;
      target.x += nudgeX;
      target.y += nudgeY;
      target.facing = sign;

      broadcast({
        type: "knockback",
        id: player.id,
        targetId: target.id,
        vx: knockVX,
        vy: knockVY,
        dx: nudgeX,
        dy: nudgeY,
      }, null, worldName);
      broadcast({
        type: "player_move",
        id: target.id,
        username: target.username,
        x: target.x,
        y: target.y,
        facing: target.facing,
        health: target.health,
      }, null, worldName);

      target.health = Math.max(0, target.health - PUNCH_DAMAGE);
      broadcast({ type: "health_update", id: target.id, health: target.health, maxHealth: target.maxHealth }, null, worldName);

      if (target.health <= 0) {
        target.health = MAX_HEALTH;
        const tDoorX = Math.floor(WORLD_WIDTH / 2);
        const tDoorBaseY = 46 + Math.floor(pseudoNoise(tDoorX) * 10);
        target.x = tDoorX * TILE;
        target.y = (tDoorBaseY - 2) * TILE;
        target.facing = 1;

        await profilesDB.update(
          { profileId: profileKey(target.userId, worldName) },
          { profileId: profileKey(target.userId, worldName), userId: target.userId, worldName, spawnX: target.x, spawnY: target.y },
          { upsert: true }
        );

        broadcast({ type: "respawn", id: target.id, x: target.x, y: target.y, health: target.health }, null, worldName);
        broadcast({ type: "health_update", id: target.id, health: target.health, maxHealth: target.maxHealth }, null, worldName);
        broadcast({
          type: "player_move",
          id: target.id,
          username: target.username,
          x: target.x,
          y: target.y,
          facing: target.facing,
          health: target.health,
        }, null, worldName);
      }
      return;
    }

    if (msg.type === "block_update") {
      const x = Number(msg.x);
      const y = Number(msg.y);
      const tile = Number(msg.tile);
      if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(tile)) return;
      if (!inBounds(x, y)) return;
      
      const doorX = Math.floor(WORLD_WIDTH / 2);
      const doorBaseY = 46 + Math.floor(pseudoNoise(doorX) * 10);
      const isDoorTile = (x === doorX && y === doorBaseY);
      if (isDoorTile) return;  // Prevent breaking/placing on door
      
      if (tile < 0 || tile > 6) return;  // Only allow tiles 0-6 (not 7 which is door)

      const world = getOrCreateWorldArray(worldName);
      world[indexOf(x, y)] = tile;
      if (tile === 0) {
        await worldDB.remove({ key: blockKey(worldName, x, y) }, { multi: true });
      } else {
        await worldDB.update(
          { key: blockKey(worldName, x, y) },
          { key: blockKey(worldName, x, y), worldName, x, y, tile, updatedAt: new Date().toISOString() },
          { upsert: true }
        );
      }

      broadcast({ type: "block_update", x, y, tile }, null, worldName);
    }

    if (msg.type === "plant_seed") {
      const x = Number(msg.x);
      const y = Number(msg.y);
      if (!Number.isInteger(x) || !Number.isInteger(y)) return;
      if (!inBounds(x, y)) return;

      const key = plantKey(worldName, x, y);
      console.log(`[${worldName}] Plant seed at ${x},${y} (rarity=${msg.sourceBlock}) - time: ${msg.totalTime}s`);
      await growingPlantsDB.update(
        { key },
        {
          key,
          worldName,
          x,
          y,
          sourceBlock: msg.sourceBlock,
          dropCount: msg.dropCount,
          totalTime: msg.totalTime,
          plantedAt: msg.plantedAt,
          fullGrown: false,
          createdAt: new Date().toISOString()
        },
        { upsert: true }
      );

      // Broadcast to all players in world
      broadcast({
        type: "plant_seed",
        x,
        y,
        sourceBlock: msg.sourceBlock,
        dropCount: msg.dropCount,
        totalTime: msg.totalTime,
        plantedAt: msg.plantedAt
      }, null, worldName);
    }

    if (msg.type === "destroy_plant") {
      const x = Number(msg.x);
      const y = Number(msg.y);
      if (!Number.isInteger(x) || !Number.isInteger(y)) return;

      const key = plantKey(worldName, x, y);
      await growingPlantsDB.remove({ key }, { multi: true });

      // Broadcast to all players in world
      broadcast({
        type: "destroy_plant",
        x,
        y
      }, null, worldName);
    }

    if (msg.type === "get_growing_plants") {
      const plants = await growingPlantsDB.find({ worldName });
      const plantsList = plants.map(p => ({
        x: p.x,
        y: p.y,
        sourceBlock: p.sourceBlock,
        dropCount: p.dropCount,
        totalTime: p.totalTime,
        plantedAt: p.plantedAt,
        fullGrown: p.fullGrown
      }));

      ws.send(JSON.stringify({
        type: "growing_plants",
        plants: plantsList
      }));
    }

    if (msg.type === "get_drops") {
      const dropsArr = Array.from(getWorldDrops(worldName).values());
      ws.send(JSON.stringify({ type: "drops", drops: dropsArr }));
      return;
    }

    if (msg.type === "drop_spawn") {
      const { id, tile, x, y, vx, vy, floatY, floatTime } = msg;
      const dropId = String(id || randomUUID());
      const drop = {
        id: dropId,
        tile: Number(tile),
        x: Number(x),
        y: Number(y),
        vx: Number(vx) || 0,
        vy: Number(vy) || 0,
        floatY: Number(floatY) || Number(y) || 0,
        floatTime: Number(floatTime) || 0,
      };
      const dropsMap = getWorldDrops(worldName);
      dropsMap.set(dropId, drop);
      broadcast({ type: "drop_spawn", drop }, null, worldName);
    }

    if (msg.type === "drop_collect") {
      const dropId = String(msg.id || "");
      const dropsMap = getWorldDrops(worldName);
      dropsMap.delete(dropId);
      broadcast({ type: "drop_collect", id: dropId }, null, worldName);
    }
  });

  ws.on("close", () => {
    players.delete(player.id);
    if (worldPlayers.has(worldName)) {
      const idx = worldPlayers.get(worldName).indexOf(playerId);
      if (idx >= 0) worldPlayers.get(worldName).splice(idx, 1);
    }
    broadcast({ type: "player_leave", id: player.id }, null, worldName);
  });
});

async function start() {
  await initStores();
  server.listen(PORT, () => {
    console.log(`Agetopia server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
