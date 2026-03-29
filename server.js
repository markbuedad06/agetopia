const express = require("express");
const path = require("path");
const http = require("http");
const { randomUUID } = require("crypto");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { WebSocketServer, WebSocket } = require("ws");

const PORT = Number(process.env.PORT || 3002);

// Build MYSQL_URL from Railway env vars (if available) or use MYSQL_URL directly
let MYSQL_URL = process.env.MYSQL_URL;
if (!MYSQL_URL && process.env.MYSQLHOST) {
  const user = process.env.MYSQLUSER || "root";
  const pass = process.env.MYSQLPASSWORD || "";
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT || 3306;
  const db = process.env.MYSQLDATABASE || "agetopia";
  MYSQL_URL = `mysql://${user}:${pass}@${host}:${port}/${db}`;
  console.log("Using Railway MySQL env vars for connection");
} else if (!MYSQL_URL) {
  MYSQL_URL = "mysql://root:password@localhost:3306/agetopia";
}

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
const LOCK_RADIUS = 10; // Tiles around a land_lock that are protected
const LAND_LOCK_TILE = 15;
const LAVA_TILE = 16;
const LAVA_DAMAGE = 15;
const LAVA_COOLDOWN_MS = 900;
const LAVA_KNOCKBACK = 420;

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

let pool;
let usersDB;
let worldDB;
let profilesDB;
let growingPlantsDB;
let inventoriesDB;
let lockedAreasDB;
let worldOwnersDB;
let worldsDB;
const worldCache = new Map();
const worldDrops = new Map(); // worldName -> Map(dropId, drop)
const lockedAreasCache = new Map(); // worldName -> Array of locked areas
const worldOwnersCache = new Map(); // worldName -> userId of owner

const INVENTORY_KEYS = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16];

// Item ID to name mapping
const ITEM_ID_TO_NAME = {
  1: "Grass Block",
  2: "Dirt Block",
  3: "Stone Block",
  4: "Wood Block",
  5: "Cloud Block",
  6: "123 Block",
  8: "Gem",
  15: "Land Lock",
  16: "Lava",
  9: "Grass Seed",
  10: "Dirt Seed",
  11: "Stone Seed",
  12: "Wood Seed",
  13: "Cloud Seed",
  14: "Glow Seed",
};

// Reverse mapping
const ITEM_NAME_TO_ID = {};
for (const [id, name] of Object.entries(ITEM_ID_TO_NAME)) {
  ITEM_NAME_TO_ID[name] = Number(id);
}

function defaultInventory() {
  const inv = {};
  Object.values(ITEM_ID_TO_NAME).forEach((name) => { inv[name] = 0; });
  // FORCE ensure land_lock is always at least 1
  inv["Land Lock"] = 1;
  return inv;
}

function sanitizeInventory(input) {
  const inv = defaultInventory();
  if (!input || typeof input !== "object") return inv;
  
  // Handle both ID-based (legacy) and name-based inventory
  for (const [key, val] of Object.entries(input)) {
    const itemName = isNaN(key) ? key : ITEM_ID_TO_NAME[Number(key)];
    if (itemName && Object.prototype.hasOwnProperty.call(inv, itemName)) {
      const num = Number(val);
      if (Number.isFinite(num) && num >= 0) {
        inv[itemName] = Math.min(INVENTORY_STACK_LIMIT, Math.floor(num));
      }
    }
  }
  
  // FORCE ensure land_lock is always at least 1
  inv["Land Lock"] = Math.max(1, inv["Land Lock"] || 0);
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

async function ensureSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(191) NOT NULL UNIQUE,
    passwordHash VARCHAR(255) NOT NULL,
    createdAt DATETIME NOT NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS world_blocks (
    ` + "`key`" + ` VARCHAR(191) PRIMARY KEY,
    worldName VARCHAR(64) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    tile INT NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX world_idx (worldName)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS profiles (
    profileId VARCHAR(191) PRIMARY KEY,
    userId INT NOT NULL,
    worldName VARCHAR(64) NOT NULL,
    spawnX INT NULL,
    spawnY INT NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS growing_plants (
    ` + "`key`" + ` VARCHAR(191) PRIMARY KEY,
    worldName VARCHAR(64) NOT NULL,
    x INT NOT NULL,
    y INT NOT NULL,
    sourceBlock INT NOT NULL,
    dropCount INT NOT NULL,
    totalTime INT NOT NULL,
    plantedAt BIGINT NOT NULL,
    fullGrown BOOLEAN NOT NULL DEFAULT FALSE,
    createdAt DATETIME NOT NULL,
    INDEX gp_world_idx (worldName)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS inventories (
    ` + "`key`" + ` VARCHAR(191) PRIMARY KEY,
    userId INT NOT NULL,
    inventory JSON NOT NULL,
    updatedAt DATETIME NOT NULL,
    UNIQUE INDEX inv_user_idx (userId)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS locked_areas (
    ` + "`key`" + ` VARCHAR(191) PRIMARY KEY,
    worldName VARCHAR(64) NOT NULL,
    userId VARCHAR(191) NOT NULL,
    centerX INT NOT NULL,
    centerY INT NOT NULL,
    radius INT NOT NULL DEFAULT 10,
    createdAt DATETIME NOT NULL,
    INDEX lock_world_idx (worldName),
    INDEX lock_user_idx (userId)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS world_owners (
    worldName VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    createdAt DATETIME NOT NULL,
    UNIQUE INDEX owner_user_idx (userId, worldName)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS worlds (
    worldName VARCHAR(64) PRIMARY KEY,
    userId VARCHAR(191) NOT NULL,
    doorX INT DEFAULT 120,
    doorY INT DEFAULT 45,
    createdAt DATETIME NOT NULL,
    updatedAt DATETIME NOT NULL,
    INDEX world_user_idx (userId)
  )`);
}

function formatDateForMySQL(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function buildPoolFromUrl() {
  const url = new URL(MYSQL_URL);
  const sslParam = url.searchParams.get("ssl");
  let ssl;
  if (sslParam === "false") {
    ssl = undefined;
  } else if (sslParam && sslParam !== "true") {
    try {
      ssl = JSON.parse(sslParam);
    } catch {
      ssl = { rejectUnauthorized: false };
    }
  } else {
    // Default: enable SSL but tolerate self-signed (Railway proxies)
    ssl = { rejectUnauthorized: false };
  }

  return mysql.createPool({
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
  });
}

function makeUsersRepo() {
  return {
    find: async () => {
      const [rows] = await pool.query("SELECT id, username, passwordHash, createdAt FROM users");
      return rows;
    },
    findOne: async (query = {}) => {
      if (query.username !== undefined) {
        const [rows] = await pool.query("SELECT id, username, passwordHash, createdAt FROM users WHERE username = ? LIMIT 1", [query.username]);
        return rows[0];
      }
      if (query.id !== undefined) {
        const [rows] = await pool.query("SELECT id, username, passwordHash, createdAt FROM users WHERE id = ? LIMIT 1", [query.id]);
        return rows[0];
      }
      return undefined;
    },
    insert: async (doc) => {
      const createdAt = doc.createdAt || formatDateForMySQL();
      const [result] = await pool.query(
        "INSERT INTO users (username, passwordHash, createdAt) VALUES (?, ?, ?)",
        [doc.username, doc.passwordHash, createdAt]
      );
      return { id: result.insertId, username: doc.username, passwordHash: doc.passwordHash, createdAt };
    },
  };
}

function makeWorldRepo() {
  return {
    find: async (query = {}) => {
      if (!query.worldName) return [];
      const [rows] = await pool.query("SELECT worldName, x, y, tile FROM world_blocks WHERE worldName = ?", [query.worldName]);
      return rows;
    },
    update: async (filter, doc) => {
      const key = filter.key || doc.key;
      if (!key) return;
      await pool.query(
        "INSERT INTO world_blocks (`key`, worldName, x, y, tile, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE worldName=VALUES(worldName), x=VALUES(x), y=VALUES(y), tile=VALUES(tile), updatedAt=VALUES(updatedAt)",
        [key, doc.worldName, doc.x, doc.y, doc.tile, doc.updatedAt || formatDateForMySQL()]
      );
    },
    remove: async (filter) => {
      if (filter.key) {
        await pool.query("DELETE FROM world_blocks WHERE `key` = ?", [filter.key]);
      }
    },
  };
}

function makeProfilesRepo() {
  return {
    findOne: async (query = {}) => {
      if (!query.profileId) return undefined;
      const [rows] = await pool.query("SELECT profileId, userId, worldName, spawnX, spawnY FROM profiles WHERE profileId = ? LIMIT 1", [query.profileId]);
      return rows[0];
    },
    update: async (filter, doc, options = {}) => {
      const profileId = filter.profileId || doc.profileId;
      if (!profileId) return;
      const payload = {
        userId: doc.userId,
        worldName: doc.worldName,
        spawnX: doc.spawnX ?? null,
        spawnY: doc.spawnY ?? null,
      };
      const upsert = Boolean(options.upsert);
      const sql = upsert
        ? "INSERT INTO profiles (profileId, userId, worldName, spawnX, spawnY) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE userId=VALUES(userId), worldName=VALUES(worldName), spawnX=VALUES(spawnX), spawnY=VALUES(spawnY)"
        : "UPDATE profiles SET userId=?, worldName=?, spawnX=?, spawnY=? WHERE profileId=?";
      const params = upsert
        ? [profileId, payload.userId, payload.worldName, payload.spawnX, payload.spawnY]
        : [payload.userId, payload.worldName, payload.spawnX, payload.spawnY, profileId];
      await pool.query(sql, params);
    },
  };
}

function makeGrowingPlantsRepo() {
  return {
    find: async (query = {}) => {
      if (!query.worldName) return [];
      const [rows] = await pool.query(
        "SELECT `key`, worldName, x, y, sourceBlock, dropCount, totalTime, plantedAt, fullGrown, createdAt FROM growing_plants WHERE worldName = ?",
        [query.worldName]
      );
      return rows;
    },
    update: async (filter, doc, options = {}) => {
      const key = filter.key || doc.key;
      if (!key) return;
      const upsert = Boolean(options.upsert);
      const payload = {
        worldName: doc.worldName,
        x: doc.x,
        y: doc.y,
        sourceBlock: doc.sourceBlock,
        dropCount: doc.dropCount,
        totalTime: doc.totalTime,
        plantedAt: doc.plantedAt,
        fullGrown: Boolean(doc.fullGrown),
        createdAt: doc.createdAt || formatDateForMySQL(),
      };
      const sql = upsert
        ? "INSERT INTO growing_plants (`key`, worldName, x, y, sourceBlock, dropCount, totalTime, plantedAt, fullGrown, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE worldName=VALUES(worldName), x=VALUES(x), y=VALUES(y), sourceBlock=VALUES(sourceBlock), dropCount=VALUES(dropCount), totalTime=VALUES(totalTime), plantedAt=VALUES(plantedAt), fullGrown=VALUES(fullGrown), createdAt=VALUES(createdAt)"
        : "UPDATE growing_plants SET worldName=?, x=?, y=?, sourceBlock=?, dropCount=?, totalTime=?, plantedAt=?, fullGrown=?, createdAt=? WHERE `key`=?";
      const params = upsert
        ? [key, payload.worldName, payload.x, payload.y, payload.sourceBlock, payload.dropCount, payload.totalTime, payload.plantedAt, payload.fullGrown, payload.createdAt]
        : [payload.worldName, payload.x, payload.y, payload.sourceBlock, payload.dropCount, payload.totalTime, payload.plantedAt, payload.fullGrown, payload.createdAt, key];
      await pool.query(sql, params);
    },
    remove: async (filter) => {
      if (filter.key) {
        await pool.query("DELETE FROM growing_plants WHERE `key` = ?", [filter.key]);
      }
    },
  };
}

function makeInventoriesRepo() {
  return {
    findOne: async (query = {}) => {
      const key = query.key;
      if (!key) return undefined;
      const [rows] = await pool.query("SELECT `key`, userId, inventory, updatedAt FROM inventories WHERE `key` = ? LIMIT 1", [key]);
      const row = rows[0];
      if (!row) return undefined;
      let inventory = {};
      try {
        inventory = typeof row.inventory === "string" ? JSON.parse(row.inventory) : row.inventory || {};
      } catch {
        inventory = {};
      }
      return { key: row.key, userId: row.userId, inventory, updatedAt: row.updatedAt };
    },
    update: async (filter, doc, options = {}) => {
      const key = filter.key || doc.key;
      if (!key) return;
      const inventoryJson = JSON.stringify(doc.inventory || {});
      const upsert = Boolean(options.upsert);
      const updatedAt = doc.updatedAt || formatDateForMySQL();
      const sql = upsert
        ? "INSERT INTO inventories (`key`, userId, inventory, updatedAt) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE userId=VALUES(userId), inventory=VALUES(inventory), updatedAt=VALUES(updatedAt)"
        : "UPDATE inventories SET userId=?, inventory=?, updatedAt=? WHERE `key`=?";
      const params = upsert
        ? [key, doc.userId, inventoryJson, updatedAt]
        : [doc.userId, inventoryJson, updatedAt, key];
      await pool.query(sql, params);
    },
  };
}

function makeLockedAreasRepo() {
  return {
    find: async (query = {}) => {
      if (!query.worldName) return [];
      const [rows] = await pool.query("SELECT `key`, worldName, userId, centerX, centerY, radius, createdAt FROM locked_areas WHERE worldName = ?", [query.worldName]);
      return rows;
    },
    findOne: async (query = {}) => {
      const key = query.key;
      if (!key) return undefined;
      const [rows] = await pool.query("SELECT `key`, worldName, userId, centerX, centerY, radius, createdAt FROM locked_areas WHERE `key` = ? LIMIT 1", [key]);
      return rows[0];
    },
    insert: async (doc) => {
      const key = doc.key || `${doc.worldName}:lock:${doc.centerX}:${doc.centerY}`;
      const createdAt = doc.createdAt || formatDateForMySQL();
      await pool.query(
        "INSERT INTO locked_areas (`key`, worldName, userId, centerX, centerY, radius, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [key, doc.worldName, doc.userId, doc.centerX, doc.centerY, doc.radius || LOCK_RADIUS, createdAt]
      );
      return { key };
    },
    remove: async (filter) => {
      if (filter.key) {
        await pool.query("DELETE FROM locked_areas WHERE `key` = ?", [filter.key]);
      }
    },
  };
}

function makeWorldOwnersRepo() {
  return {
    findOne: async (query = {}) => {
      const worldName = query.worldName;
      if (!worldName) return undefined;
      const [rows] = await pool.query("SELECT worldName, userId, createdAt FROM world_owners WHERE worldName = ? LIMIT 1", [worldName]);
      return rows[0];
    },
    insert: async (doc) => {
      const createdAt = doc.createdAt || formatDateForMySQL();
      await pool.query(
        "INSERT INTO world_owners (worldName, userId, createdAt) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE userId=VALUES(userId)",
        [doc.worldName, doc.userId, createdAt]
      );
    },
    remove: async (filter = {}) => {
      if (!filter.worldName) return;
      await pool.query("DELETE FROM world_owners WHERE worldName = ?", [filter.worldName]);
    },
  };
}

function makeWorldsRepo() {
  return {
    findOne: async (query = {}) => {
      const worldName = query.worldName;
      if (!worldName) return undefined;
      const [rows] = await pool.query("SELECT worldName, userId, doorX, doorY, createdAt, updatedAt FROM worlds WHERE worldName = ? LIMIT 1", [worldName]);
      return rows[0];
    },
    insert: async (doc) => {
      const createdAt = doc.createdAt || formatDateForMySQL();
      const updatedAt = doc.updatedAt || formatDateForMySQL();
      await pool.query(
        "INSERT INTO worlds (worldName, userId, doorX, doorY, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE userId=VALUES(userId), doorX=VALUES(doorX), doorY=VALUES(doorY), updatedAt=VALUES(updatedAt)",
        [doc.worldName, doc.userId, doc.doorX || 120, doc.doorY || 45, createdAt, updatedAt]
      );
    },
    update: async (filter, doc) => {
      const worldName = filter.worldName || doc.worldName;
      if (!worldName) return;
      const updatedAt = doc.updatedAt || formatDateForMySQL();
      await pool.query(
        "UPDATE worlds SET userId=?, doorX=?, doorY=?, updatedAt=? WHERE worldName=?",
        [doc.userId, doc.doorX, doc.doorY, updatedAt, worldName]
      );
    },
  };
}

async function initStores() {
  pool = buildPoolFromUrl();
  await ensureSchema();
  usersDB = makeUsersRepo();
  worldDB = makeWorldRepo();
  profilesDB = makeProfilesRepo();
  growingPlantsDB = makeGrowingPlantsRepo();
  inventoriesDB = makeInventoriesRepo();
  lockedAreasDB = makeLockedAreasRepo();
  worldOwnersDB = makeWorldOwnersRepo();
  worldsDB = makeWorldsRepo();
  
  // Run migration to convert inventory from ID-based to name-based
  await migrateInventoryToNames();
  
  // Cleanup: ensure all inventories have land_lock
  await ensureLandLockInAllInventories();
}

async function ensureLandLockInAllInventories() {
  try {
    console.log("Ensuring all inventories have Land Lock...");
    const [allRows] = await pool.query("SELECT `key`, inventory FROM inventories");
    
    let updatedCount = 0;
    for (const row of allRows) {
      let inventory = {};
      try {
        inventory = typeof row.inventory === "string" ? JSON.parse(row.inventory) : row.inventory || {};
      } catch {
        continue;
      }
      
      // Check if land_lock is missing or 0
      if (!inventory["Land Lock"] || inventory["Land Lock"] < 1) {
        inventory["Land Lock"] = 1;
        const updatedJson = JSON.stringify(inventory);
        await pool.query(
          "UPDATE inventories SET inventory = ? WHERE `key` = ?",
          [updatedJson, row.key]
        );
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`Updated ${updatedCount} inventories to include Land Lock`);
    } else {
      console.log("All inventories already have Land Lock");
    }
  } catch (err) {
    console.error("Error ensuring land_lock in inventories (non-fatal):", err.message);
  }
}

async function migrateInventoryToNames() {
  try {
    console.log("Checking if inventory migration is needed...");
    const [rows] = await pool.query("SELECT `key`, inventory FROM inventories LIMIT 1");
    if (rows.length === 0) {
      console.log("No inventory data to migrate");
      return;
    }
    
    const firstInventory = rows[0].inventory;
    let inventory = {};
    try {
      inventory = typeof firstInventory === "string" ? JSON.parse(firstInventory) : firstInventory || {};
    } catch {
      return;
    }
    
    // Check if already using item names (if any key is a string that's a valid item name)
    const isAlreadyMigrated = Object.keys(inventory).some(key => Object.prototype.hasOwnProperty.call(ITEM_NAME_TO_ID, key));
    if (isAlreadyMigrated) {
      console.log("Inventory already uses item names");
      return;
    }
    
    // Check if using numeric IDs
    const isNumericInventory = Object.keys(inventory).some(key => !isNaN(key));
    if (!isNumericInventory) {
      console.log("Inventory format not recognized for migration");
      return;
    }
    
    console.log("Migrating inventories from ID-based to name-based...");
    const [allRows] = await pool.query("SELECT `key`, userId, inventory FROM inventories");
    
    let migratedCount = 0;
    for (const row of allRows) {
      let oldInv = {};
      try {
        oldInv = typeof row.inventory === "string" ? JSON.parse(row.inventory) : row.inventory || {};
      } catch {
        continue;
      }
      
      // Convert from ID-based to name-based
      const newInv = {};
      for (const [key, value] of Object.entries(oldInv)) {
        const itemId = Number(key);
        const itemName = ITEM_ID_TO_NAME[itemId];
        if (itemName) {
          newInv[itemName] = value;
        }
      }
      
      // FORCE ensure Land Lock is always at least 1
      newInv["Land Lock"] = Math.max(1, newInv["Land Lock"] || 0);
      
      const newInvJson = JSON.stringify(newInv);
      await pool.query(
        "UPDATE inventories SET inventory = ? WHERE `key` = ?",
        [newInvJson, row.key]
      );
      migratedCount++;
    }
    
    console.log(`Successfully migrated ${migratedCount} inventory records to use item names with Land Lock guaranteed`);
  } catch (err) {
    console.error("Migration encountered an issue (non-fatal):", err.message);
    // Don't throw - allow server to continue even if migration has issues
  }
}

async function clearAllGameData() {
  try {
    console.log("🧹 Clearing all game data...");
    
    // Truncate all game tables to remove worlds, blocks, plants, locks, etc.
    await pool.query("TRUNCATE TABLE world_blocks");
    console.log("✓ Cleared world_blocks");
    
    await pool.query("TRUNCATE TABLE growing_plants");
    console.log("✓ Cleared growing_plants");
    
    await pool.query("TRUNCATE TABLE locked_areas");
    console.log("✓ Cleared locked_areas");
    
    await pool.query("TRUNCATE TABLE world_owners");
    console.log("✓ Cleared world_owners");
    
    await pool.query("TRUNCATE TABLE worlds");
    console.log("✓ Cleared worlds");
    
    // Clear caches
    worldCache.clear();
    worldDrops.clear();
    lockedAreasCache.clear();
    worldOwnersCache.clear();
    console.log("✓ Cleared all caches");
    
    console.log("✅ All game data cleared! Fresh start ready.");
  } catch (err) {
    console.error("❌ Error clearing game data:", err.message);
    throw err;
  }
}

async function hasAnyLocks(worldName) {
  const locks = await lockedAreasDB.find({ worldName });
  return Array.isArray(locks) && locks.length > 0;
}

// Hash function for locking key
function lockKey(worldName, centerX, centerY) {
  return `${worldName}:lock:${centerX}:${centerY}`;
}

// Check if a position is within a locked area
async function isPositionLocked(worldName, x, y, userId = null) {
  // Load locked areas for this world if not cached
  if (!lockedAreasCache.has(worldName)) {
    const locks = await lockedAreasDB.find({ worldName });
    lockedAreasCache.set(worldName, locks || []);
  }
  
  const locks = lockedAreasCache.get(worldName) || [];
  
  for (const lock of locks) {
    const dist = Math.sqrt(Math.pow(x - lock.centerX, 2) + Math.pow(y - lock.centerY, 2));
    if (dist <= lock.radius) {
      // If userId is provided and matches lock owner, allow it
      if (userId && String(lock.userId) === String(userId)) return false;
      return true; // Position is locked and not owned by this user
    }
  }
  return false; // Not locked
}

// Create a lock when land_lock is placed
async function createLock(worldName, centerX, centerY, userId) {
  const key = lockKey(worldName, centerX, centerY);
  const existing = await lockedAreasDB.findOne({ key });
  if (!existing) {
    await lockedAreasDB.insert({
      key,
      worldName,
      userId: String(userId),
      centerX,
      centerY,
      radius: LOCK_RADIUS,
    });
    // Invalidate cache
    lockedAreasCache.delete(worldName);
  }
}

// Remove a lock when land_lock is broken
async function removeLock(worldName, centerX, centerY) {
  const key = lockKey(worldName, centerX, centerY);
  await lockedAreasDB.remove({ key });
  // Invalidate cache
  lockedAreasCache.delete(worldName);
}

// Get world owner (from cache or database)
async function getWorldOwner(worldName) {
  // Check cache first
  if (worldOwnersCache.has(worldName)) {
    return worldOwnersCache.get(worldName);
  }
  
  // Query database
  const owner = await worldOwnersDB.findOne({ worldName });
  if (owner) {
    try {
      const ownerUser = await usersDB.findOne({ id: owner.userId });
      if (!ownerUser) {
        console.warn(`[${worldName}] Clearing stale world owner ${owner.userId} (user not found)`);
        await pool.query("DELETE FROM world_owners WHERE worldName = ?", [worldName]);
        worldOwnersCache.delete(worldName);
        return null;
      }
    } catch (err) {
      console.error("Error validating world owner:", err);
    }

    const ownerId = String(owner.userId);
    worldOwnersCache.set(worldName, ownerId);
    return ownerId;
  }
  
  return null; // No owner yet
}

// Set world owner (first player to place land_lock claims the world)
async function setWorldOwner(worldName, userId) {
  const ownerId = String(userId);
  // Only set if not already owned
  const existing = await getWorldOwner(worldName);
  if (existing && existing !== ownerId) {
    return false; // World already claimed by someone else
  }
  
  await worldOwnersDB.insert({
    worldName,
    userId: ownerId,
  });

  // Also create/update in worlds table
  await worldsDB.insert({
    worldName,
    userId: ownerId,
  });
  
  // Update cache
  worldOwnersCache.set(worldName, ownerId);
  return true; // Successfully claimed
}

async function clearWorldOwner(worldName) {
  await worldOwnersDB.remove({ worldName });
  await worldsDB.update({ worldName }, { worldName, userId: "" });
  worldOwnersCache.delete(worldName);
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

  // Fill the bottom of the world with lava to create a lethal floor
  const lavaDepth = 3;
  for (let y = WORLD_HEIGHT - lavaDepth; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      world[indexOf(x, y)] = LAVA_TILE;
    }
  }

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

    if (username.length < 3 || username.length > 24) {
      return res.status(400).json({ error: "Username must be 3-24 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await usersDB.findOne({ username });
    if (existing) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await usersDB.insert({ username, passwordHash });

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

app.post("/api/admin/clear-game-data", async (req, res) => {
  try {
    await clearAllGameData();
    return res.json({ success: true, message: "Game data cleared successfully" });
  } catch (err) {
    console.error("Error clearing game data via API:", err);
    return res.status(500).json({ error: "Failed to clear game data: " + err.message });
  }
});

app.post("/api/admin/clear-world-blocks", async (req, res) => {
  try {
    console.log("🧹 Clearing world_blocks table...");
    await pool.query("TRUNCATE TABLE world_blocks");
    worldCache.clear();
    worldDrops.clear();
    console.log("✅ world_blocks cleared successfully");
    return res.json({ success: true, message: "world_blocks table cleared" });
  } catch (err) {
    console.error("Error clearing world_blocks:", err);
    return res.status(500).json({ error: "Failed to clear world_blocks: " + err.message });
  }
});

// List claimed worlds with owner and online player count
app.get("/api/worlds", authFromHeader, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT w.worldName, wo.userId AS ownerId, u.username AS ownerName, w.createdAt
       FROM worlds w
       INNER JOIN world_owners wo ON wo.worldName = w.worldName
       LEFT JOIN users u ON u.id = wo.userId
       ORDER BY w.createdAt DESC`
    );

    const worlds = rows.map((row) => ({
      worldName: row.worldName,
      ownerId: row.ownerId || null,
      ownerName: row.ownerName || "Unknown",
      playerCount: (worldPlayers.get(row.worldName) || []).length,
    }));

    return res.json({ worlds });
  } catch (err) {
    console.error("Error fetching worlds list:", err);
    return res.status(500).json({ error: "Failed to fetch worlds" });
  }
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
    lastLavaHitAt: 0,
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

  function getPlayerTileBounds(p) {
    const left = Math.floor(p.x / TILE);
    const right = Math.floor((p.x + 23) / TILE);
    const top = Math.floor(p.y / TILE);
    const bottom = Math.floor((p.y + 31) / TILE);
    return { left, right, top, bottom };
  }

  async function respawnPlayer(target) {
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
      userId: target.userId,
      username: target.username,
      x: target.x,
      y: target.y,
      facing: target.facing,
      health: target.health,
    }, null, worldName);
  }

  async function handleLavaContact(p) {
    const bounds = getPlayerTileBounds(p);
    const worldArr = getOrCreateWorldArray(worldName);

    // Expand bounds by 1 to catch corner/edge proximity
    const scanLeft = Math.max(0, bounds.left - 1);
    const scanRight = Math.min(WORLD_WIDTH - 1, bounds.right + 1);
    const scanTop = Math.max(0, bounds.top - 1);
    const scanBottom = Math.min(WORLD_HEIGHT - 1, bounds.bottom + 1);

    let lavaHit = null;
    for (let ty = scanTop; ty <= scanBottom; ty += 1) {
      for (let tx = scanLeft; tx <= scanRight; tx += 1) {
        if (worldArr[indexOf(tx, ty)] === LAVA_TILE) {
          lavaHit = { tx, ty };
          break;
        }
      }
      if (lavaHit) break;
    }

    if (!lavaHit) return;

    const now = Date.now();
    if (p.lastLavaHitAt && now - p.lastLavaHitAt < LAVA_COOLDOWN_MS) return;
    p.lastLavaHitAt = now;

    const lavaCenterX = lavaHit.tx * TILE + TILE * 0.5;
    const playerCenterX = p.x + 12;
    const dir = Math.sign(playerCenterX - lavaCenterX) || (p.facing || 1);
    const knockVX = LAVA_KNOCKBACK * dir;
    const knockVY = KNOCKBACK_LIFT;
    const nudgeX = dir * 22;
    const nudgeY = -10;

    p.x += nudgeX;
    p.y += nudgeY;
    p.facing = dir;

    broadcast({
      type: "knockback",
      id: p.id,
      targetId: p.id,
      vx: knockVX,
      vy: knockVY,
      dx: nudgeX,
      dy: nudgeY,
    }, null, worldName);

    broadcast({
      type: "player_move",
      id: p.id,
      userId: p.userId,
      username: p.username,
      x: p.x,
      y: p.y,
      facing: p.facing,
      health: p.health,
    }, null, worldName);

    p.health = Math.max(0, p.health - LAVA_DAMAGE);
    broadcast({ type: "health_update", id: p.id, health: p.health, maxHealth: p.maxHealth }, null, worldName);

    if (p.health <= 0) {
      await respawnPlayer(p);
    }
  }

  // Ensure world exists in worlds table (create with default owner if new)
  const existingWorld = await worldsDB.findOne({ worldName });
  if (!existingWorld) {
    await worldsDB.insert({
      worldName,
      userId: "", // Will be set when someone places land_lock
    });
  }

  const others = [];
  for (const [id, p] of players.entries()) {
    if (id === playerId || p.worldName !== worldName) continue;
    others.push({
      id: p.id,
      userId: p.userId,
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

  // Get world owner if exists
  const worldOwnerId = await getWorldOwner(worldName);
  let ownerInfo = null;
  if (worldOwnerId) {
    // worldOwnerId stores the account userId; find the username from current players or users table
    let ownerUsername = "Unknown";
    for (const [, p] of players.entries()) {
      if (String(p.userId) === String(worldOwnerId)) {
        ownerUsername = p.username;
        break;
      }
    }
    // If player not in current session, try to look up from users table as fallback
    if (ownerUsername === "Unknown") {
      // Try both numeric ID and UUID lookups
      const ownerUser = await usersDB.findOne({ id: worldOwnerId }).catch(() => null);
      if (ownerUser) {
        ownerUsername = ownerUser.username;
      }
    }
    ownerInfo = { userId: worldOwnerId, username: ownerUsername };
    console.log(`[${worldName}] World owner info for init:`, { ownerId: worldOwnerId, ownerUsername: ownerUsername, currentPlayerId: player.id });
  }

  ws.send(JSON.stringify({
    type: "init",
    id: player.id,
    userId: player.userId,
    username: player.username,
    worldName,
    worldOwner: ownerInfo,
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
      userId: player.userId,
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
      try {
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
          userId: player.userId,
          username: player.username,
          x: player.x,
          y: player.y,
          facing: player.facing,
          health: player.health,
        }, player.id, worldName);

        await handleLavaContact(player);
      } catch (err) {
        console.error("Error in player_move:", err);
        send({ type: "error", message: "Player move failed" });
      }
      return;
    }

    if (msg.type === "inventory_update") {
      try {
        const inv = sanitizeInventory(msg.inventory);
        await inventoriesDB.update(
          { key: inventoryKey(player.userId) },
          { key: inventoryKey(player.userId), userId: player.userId, inventory: inv, updatedAt: formatDateForMySQL() },
          { upsert: true }
        );
      } catch (err) {
        console.error("Error in inventory_update:", err);
        send({ type: "error", message: "Inventory update failed" });
      }
      return;
    }

    if (msg.type === "punch_player") {
      try {
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
          await respawnPlayer(target);
        }
      } catch (err) {
        console.error("Error in punch_player:", err);
        send({ type: "error", message: "Punch failed" });
      }
      return;
    }

    if (msg.type === "chat") {
      try {
        const text = String(msg.text || "").trim().slice(0, 100);
        if (!text) return;

        const payload = {
          type: "chat",
          id: player.id,
          userId: player.userId,
          username: player.username,
          text,
        };

        broadcast(payload, null, worldName);
      } catch (err) {
        console.error("Error in chat message:", err);
        send({ type: "error", message: "Chat failed" });
      }
      return;
    }

    if (msg.type === "block_update") {
      try {
        const x = Number(msg.x);
        const y = Number(msg.y);
        const tile = Number(msg.tile);
        if (!Number.isInteger(x) || !Number.isInteger(y) || !Number.isInteger(tile)) return;
        if (!inBounds(x, y)) return;
        
        const doorX = Math.floor(WORLD_WIDTH / 2);
        const doorBaseY = 46 + Math.floor(pseudoNoise(doorX) * 10);
        const isDoorTile = (x === doorX && y === doorBaseY);
        if (isDoorTile) return;  // Prevent breaking/placing on door
        
        if (tile < 0 || (tile > 6 && tile !== LAND_LOCK_TILE && tile !== LAVA_TILE)) return;  // Allow tiles 0-6, land_lock(15), lava(16)

        // Check world ownership - owner can build anywhere, non-owners can't build in owned worlds
        const worldOwner = await getWorldOwner(worldName);
        const worldOwnerId = worldOwner ? String(worldOwner) : null;
        const playerOwnerId = String(player.userId);
        const isOwner = worldOwnerId && worldOwnerId === playerOwnerId;
        
        if (worldOwnerId && !isOwner) {
          // World is owned by another player - reject
          send({ type: "error", message: "This world is owned by another player" });
          return;
        }

        // If world has no owner yet and trying to place land_lock, that's allowed (will claim it)
        // If world has owner and player is owner, they can place anywhere (skip lock check)
        if (!isOwner && worldOwnerId !== null) {
          // This shouldn't happen since we already rejected non-owners above
          send({ type: "error", message: "Cannot build in this world" });
          return;
        }

        // For the actual placement, owner doesn't need lock checks
        // Only check locks if no owner yet (shouldn't reach here due to earlier check)
        const world = getOrCreateWorldArray(worldName);
        const oldTile = world[indexOf(x, y)];
        
        // Handle land_lock placement/removal
        if (tile === LAND_LOCK_TILE && oldTile !== LAND_LOCK_TILE) {
          // Placing land_lock - claim the world if not already owned
          const claimed = await setWorldOwner(worldName, player.userId);
          if (!claimed && worldOwnerId && worldOwnerId !== playerOwnerId) {
            send({ type: "error", message: "This world has already been claimed" });
            return;
          }
          // Create a lock around this land_lock
          await createLock(worldName, x, y, player.userId);
          
          // Broadcast world owner info to all players in world
          console.log(`[${worldName}] Claimed by user ${player.userId} (${player.username})`);
          broadcast({ 
            type: "world_owner_set", 
            userId: player.userId,
            username: player.username
          }, null, worldName);
        } else if (tile === 0 && oldTile === LAND_LOCK_TILE) {
          // Removing land_lock - remove the lock
          await removeLock(worldName, x, y);
          const locksRemain = await hasAnyLocks(worldName);
          if (!locksRemain) {
            await clearWorldOwner(worldName);
            broadcast({ type: "world_owner_set", userId: null, username: null }, null, worldName);
            console.log(`[${worldName}] Land lock removed; world ownership cleared`);
          }
        }
        
        world[indexOf(x, y)] = tile;
        if (tile === 0) {
          await worldDB.remove({ key: blockKey(worldName, x, y) }, { multi: true });
        } else {
          await worldDB.update(
            { key: blockKey(worldName, x, y) },
            { key: blockKey(worldName, x, y), worldName, x, y, tile, updatedAt: formatDateForMySQL() },
            { upsert: true }
          );
        }

        broadcast({ type: "block_update", x, y, tile }, null, worldName);
      } catch (err) {
        console.error("Error in block_update:", err);
        send({ type: "error", message: "Block update failed" });
      }
    }

    if (msg.type === "plant_seed") {
      try {
        const x = Number(msg.x);
        const y = Number(msg.y);
        if (!Number.isInteger(x) || !Number.isInteger(y)) return;
        if (!inBounds(x, y)) return;

        // Check world ownership - only owner can plant seeds
        const worldOwner = await getWorldOwner(worldName);
        const worldOwnerId = worldOwner ? String(worldOwner) : null;
        const playerOwnerId = String(player.userId);
        const isOwner = worldOwnerId && worldOwnerId === playerOwnerId;
        
        if (worldOwnerId && !isOwner) {
          send({ type: "error", message: "Only the world owner can plant seeds" });
          return;
        }

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
            createdAt: formatDateForMySQL()
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
      } catch (err) {
        console.error("Error in plant_seed:", err);
        send({ type: "error", message: "Planting failed" });
      }
    }

    if (msg.type === "destroy_plant") {
      try {
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
      } catch (err) {
        console.error("Error in destroy_plant:", err);
        send({ type: "error", message: "Plant destruction failed" });
      }
    }

    if (msg.type === "get_growing_plants") {
      try {
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
      } catch (err) {
        console.error("Error in get_growing_plants:", err);
        send({ type: "error", message: "Failed to fetch plants" });
      }
    }

    if (msg.type === "get_locked_areas") {
      try {
        const locks = await lockedAreasDB.find({ worldName });
        const locksList = locks.map(lock => ({
          userId: lock.userId,
          centerX: lock.centerX,
          centerY: lock.centerY,
          radius: lock.radius
        }));

        ws.send(JSON.stringify({
          type: "locked_areas",
          locks: locksList
        }));
      } catch (err) {
        console.error("Error in get_locked_areas:", err);
        send({ type: "error", message: "Failed to fetch locked areas" });
      }
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
  
  // Clear all game data if flag is set
  if (process.env.CLEAR_GAME_DATA === "true") {
    await clearAllGameData();
  }
  
  server.listen(PORT, () => {
    console.log(`Agetopia server running at http://localhost:${PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
