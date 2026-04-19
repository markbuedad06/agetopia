const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const inventoryEl = document.getElementById("inventory");
const quickSlotsEl = document.getElementById("quickSlots");
const btnPunch = document.getElementById("btnPunch");
const inventoryExpandBtn = document.getElementById("inventoryExpandBtn");
const inventoryModal = document.getElementById("inventoryModal");
const inventoryCloseBtn = document.getElementById("inventoryCloseBtn");
const dropBtn = document.getElementById("dropBtn");
const dropModal = document.getElementById("dropModal");
const dropAmountInput = document.getElementById("dropAmountInput");
const dropConfirmBtn = document.getElementById("dropConfirmBtn");
const dropCancelBtn = document.getElementById("dropCancelBtn");
const dropItemLabel = document.getElementById("dropItemLabel");
const gemCountEl = document.getElementById("gemCount");
const authMessageEl = document.getElementById("authMessage");
const onlineStateEl = document.getElementById("onlineState");
const menuBtn = document.getElementById("menuBtn");
const menuModal = document.getElementById("menuModal");
const settingsModal = document.getElementById("settingsModal");
const menuSettingsBtn = document.getElementById("menuSettingsBtn");
const menuExitBtn = document.getElementById("menuExitBtn");
const menuLogoutBtn = document.getElementById("menuLogoutBtn");
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatBar = document.getElementById("chatBar");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");
const chatHistoryPanel = document.getElementById("chatHistoryPanel");
const chatHistoryList = document.getElementById("chatHistoryList");
const chatHistoryToggle = document.getElementById("chatHistoryToggle");
const friendsChatToggle = document.getElementById("friendsChatToggle");
const friendsChatPanel = document.getElementById("friendsChatPanel");
const friendsChatClose = document.getElementById("friendsChatClose");
const friendSearchInput = document.getElementById("friendSearchInput");
const friendSearchBtn = document.getElementById("friendSearchBtn");
const friendSearchResults = document.getElementById("friendSearchResults");
const friendsListEl = document.getElementById("friendsList");
const friendsConversationHeader = document.getElementById("friendsConversationHeader");
const friendsMessagesEl = document.getElementById("friendsMessages");
const friendsMessageInput = document.getElementById("friendsMessageInput");
const friendsMessageSend = document.getElementById("friendsMessageSend");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const graphicsScaleEl = document.getElementById("graphicsScale");
const toggleReachRingEl = document.getElementById("toggleReachRing");
const toggleCloudsEl = document.getElementById("toggleClouds");

const TILE = 32;
const WORLD_WIDTH = 151;
const WORLD_HEIGHT = 151;
const LAVA_PATCH_MIN_HEIGHT = 1;
const LAVA_PATCH_MAX_HEIGHT = 5;
const STONE_PATCH_MIN_HEIGHT = 6;
const STONE_PATCH_MAX_HEIGHT = 40;
const DIRT_UPPER_MIN_HEIGHT = 41;
const DIRT_UPPER_MAX_HEIGHT = 45;
const GRASS_SURFACE_HEIGHT = 46;
const DOOR_HEIGHT = 47;
const CLOUD_MIN_HEIGHT = 81;
const URL_PARAMS = new URLSearchParams(window.location.search);
const ONLINE_MODE = URL_PARAMS.get("online") === "1";
const WORLD_NAME = URL_PARAMS.get("world") || localStorage.getItem("agetopia_world") || "default";
const TOKEN_KEY = "agetopia_token";
const LOGIN_PAGE = "login.html";
const WORLD_PAGE = "worlds.html";
const SETTINGS_KEY = "agetopia_settings";
const INVENTORY_STATE_KEY = "agetopia_inventory_open";
const INVENTORY_ITEMS_KEY = "agetopia_inventory_items";
const LAST_USERNAME_KEY = "agetopia_last_username";
const GROWING_PLANTS_KEY = "agetopia_growing_plants";
const ASSET_VERSION = "20260402-stone-refresh";
const MANAGED_ASSET_PREFIXES = ["assets/blocks/", "assets/items/"];
const ASSET_MANIFEST_REFRESH_MS = 3000;
const RENDER_SCALE_LOW = 0.55;
const RENDER_SCALE_MEDIUM = 0.7;
const RENDER_SCALE_HIGH = 0.85;
const RENDER_SCALE_OPTIONS = [RENDER_SCALE_LOW, RENDER_SCALE_MEDIUM, RENDER_SCALE_HIGH];
const INVENTORY_STACK_LIMIT = 99;
const MAX_HEALTH = 100;
const TREE_BREAK_SECONDS = 4;
const PUNCH_RANGE_TILES = 3;
const PUNCH_COOLDOWN_MS = 320;
const PUNCH_ANIM_MS = 180;
const DIGIT_COMBO_TIMEOUT_MS = 1600;
const KNOCKBACK_PUSH = 360;
const KNOCKBACK_LIFT = 240;
const KNOCKBACK_NUDGE_DURATION = 0.12;
const KNOCKBACK_RECOVERY_MS = 180;
const GRAVITY = 1200;
const MAX_FALL_SPEED = 900;
const MAX_JUMP_HEIGHT_BLOCKS = 3;
const JUMP_MAX_VELOCITY = Math.sqrt(2 * GRAVITY * TILE * MAX_JUMP_HEIGHT_BLOCKS);
const JUMP_RELEASE_VELOCITY = JUMP_MAX_VELOCITY * 0.42;
const DROP_FLOAT_SPEED = 80;
const MANUAL_DROP_FORWARD_OFFSET = TILE + 8;
const MANUAL_DROP_PICKUP_LOCK_MS = 900;
const PLAYER_HITBOX_SIZE = TILE * 0.8;
const LAVA_DAMAGE = 10;
const LAVA_COOLDOWN_MS = 300;
const LAVA_KNOCKBACK = 300;
const LAVA_CONTACT_INSET = 0;
const LAVA_TOUCH_TOLERANCE = 1;
const LAVA_SWEEP_STEP_PX = TILE * 0.25;
const UNSTICK_SEARCH_RADIUS = TILE * 1.5;
const UNSTICK_SEARCH_STEP = 2;
const LAVA_TILE = 16;

const tileDefs = {
  0: { name: "Air", color: "rgba(0,0,0,0)", solid: false, hardness: 0, texture: null, rarity: 0 },
  1: { name: "Grass", color: "#62c462", solid: true, hardness: 0.3, texture: "assets/blocks/grass-block.png", rarity: 1 },
  2: { name: "Dirt", color: "#8f5f3d", solid: true, hardness: 0.5, texture: "assets/blocks/dirt-block.png", rarity: 1 },
  3: { name: "Stone", color: "#8d98a2", solid: true, hardness: 0.8, texture: "assets/blocks/stone-block.png", rarity: 2 },
  4: { name: "Wood", color: "#c48a4d", solid: true, hardness: 0.4, texture: "assets/blocks/wood.svg", rarity: 1 },
  5: { name: "Cloud", color: "#dae9ff", solid: false, hardness: 0, texture: "assets/blocks/cloud.svg", rarity: 1 },
  6: { name: "123 Block", color: "#f59e0b", solid: true, hardness: 0.45, texture: "assets/blocks/block-123.svg", rarity: 3 },
  7: { name: "Door", color: "rgba(217, 119, 6, 0.3)", solid: false, hardness: 0, texture: "assets/blocks/world-door.png", rarity: 0 },
   16: { name: "Lava", color: "#e25822", solid: true, hardness: 0.2, texture: "assets/blocks/lava.svg", rarity: 1 },
  15: { name: "Land Lock", color: "#FFD700", solid: true, hardness: 2.0, texture: "assets/blocks/land-lock.svg", rarity: 1 },
  // Growing seeds (100-106)
  100: { name: "Growing Grass", color: "#62c462", solid: false, hardness: 0, texture: null, rarity: 1, sourceBlock: 1, sourceItem: 9 },
  101: { name: "Growing Dirt", color: "#8f5f3d", solid: false, hardness: 0, texture: null, rarity: 1, sourceBlock: 2, sourceItem: 10 },
  102: { name: "Growing Stone", color: "#8d98a2", solid: false, hardness: 0, texture: null, rarity: 2, sourceBlock: 3, sourceItem: 11 },
  103: { name: "Growing Wood", color: "#c48a4d", solid: false, hardness: 0, texture: null, rarity: 1, sourceBlock: 4, sourceItem: 12 },
  104: { name: "Growing Cloud", color: "#dae9ff", solid: false, hardness: 0, texture: null, rarity: 1, sourceBlock: 5, sourceItem: 13 },
  105: { name: "Growing 123", color: "#f59e0b", solid: false, hardness: 0, texture: null, rarity: 3, sourceBlock: 6, sourceItem: 14 },
    106: { name: "Growing Lava", color: "#f17036", solid: false, hardness: 0, texture: null, rarity: 1, sourceBlock: 16, sourceItem: 17 },
};

const itemDefs = {
  1: { name: "Grass Block", icon: "assets/items/grass-block.png", color: "#62c462", rarity: 1 },
  2: { name: "Dirt Block", icon: "assets/items/dirt-block.png", color: "#8f5f3d", rarity: 1 },
  3: { name: "Stone Block", icon: "assets/items/stone-block.png", color: "#8d98a2", rarity: 1 },
  4: { name: "Wood Block", icon: "assets/items/wood-block.svg", color: "#c48a4d", rarity: 1 },
  5: { name: "Cloud Block", icon: "assets/items/cloud-piece.svg", color: "#dae9ff", rarity: 1 },
  6: { name: "123 Block", icon: "assets/items/item-123.svg", color: "#f59e0b", rarity: 1 },
  8: { name: "Gem", icon: "assets/items/gem.svg", color: "#3b82f6", rarity: 3 },
  15: { name: "Land Lock", icon: "assets/items/land-lock.svg", color: "#FFD700", rarity: 1 },
   16: { name: "Lava", icon: "assets/items/lava-block.svg", color: "#e25822", rarity: 1 },
   17: { name: "Lava Seed", icon: "assets/items/lava-seed.svg", color: "#e25822", rarity: 1 },
  9: { name: "Grass Seed", icon: "assets/items/grass-seed.svg", color: "#62c462", rarity: 1 },
  10: { name: "Dirt Seed", icon: "assets/items/dirt-seed.svg", color: "#8f5f3d", rarity: 1 },
  11: { name: "Stone Seed", icon: "assets/items/stone-seed.svg", color: "#8d98a2", rarity: 1 },
  12: { name: "Wood Seed", icon: "assets/items/wood-seed.svg", color: "#c48a4d", rarity: 1 },
  13: { name: "Cloud Seed", icon: "assets/items/cloud-seed.svg", color: "#dae9ff", rarity: 1 },
  14: { name: "123 Seed", icon: "assets/items/123-seed.svg", color: "#f59e0b", rarity: 1 },
};

// Build item name to ID mapping
const ITEM_NAME_TO_ID = {};
for (const [id, def] of Object.entries(itemDefs)) {
  ITEM_NAME_TO_ID[def.name] = Number(id);
}

const hotbarOrder = [1, 2, 3, 4, 5, 6, 16, 9, 10, 11, 12, 13, 14, 15, 17];

// Simple inventory state
const inventory = {
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  8: 0,
  9: 0,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
  16: 0,
  17: 0,
};

let selectedSlot = 0;

const world = new Uint8Array(WORLD_WIDTH * WORLD_HEIGHT);
const remotePlayers = new Map();
const drops = new Map();
const growingPlants = new Map(); // Track growing seeds: "x:y" -> { progress, totalTime }
const lockedAreas = []; // Array of locked areas: { userId, centerX, centerY, radius }
const chatBubbles = new Map(); // playerId -> { text, expiresAt, username }
const chatHistory = [];
const chatHistoryIds = new Set();
const CHAT_HISTORY_WINDOW_MS = 60 * 60 * 1000;
let chatPruneTimer = null;
const friendsState = {
  pairs: [],
  messages: new Map(), // pairId -> array of messages
  activePairId: null,
  searchResults: [],
};
let friendSearchDebounce = null;
let nextDropId = 1;
let selectedInventoryTile = null;

function makeDropId() {
  return `${networkState.userId || "local"}-${nextDropId++}`;
}

function normalizeDropCount(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 1;
  return Math.max(1, Math.floor(parsed));
}

function normalizeDropPosition(x, y) {
  const rawX = Number(x);
  const rawY = Number(y);
  const safeX = Number.isFinite(rawX) ? rawX : 0;
  const safeY = Number.isFinite(rawY) ? rawY : 0;
  const tx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor(safeX / TILE)));
  const ty = Math.max(0, Math.min(WORLD_HEIGHT - 1, Math.floor(safeY / TILE)));
  return {
    tx,
    ty,
    x: tx * TILE + TILE / 2,
    y: ty * TILE + TILE / 2,
  };
}

function normalizeDropRecord(rawDrop) {
  if (!rawDrop || rawDrop.id == null) return null;
  const tile = Number(rawDrop.tile);
  if (!Number.isFinite(tile)) return null;
  const pos = normalizeDropPosition(rawDrop.x, rawDrop.y);
  const pickupLockedUntilRaw = Number(rawDrop.pickupLockedUntil);
  return {
    id: String(rawDrop.id),
    tile,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    floatY: pos.y,
    floatTime: Number(rawDrop.floatTime) || 0,
    count: normalizeDropCount(rawDrop.count),
    pickupLockedUntil: Number.isFinite(pickupLockedUntilRaw) ? Math.max(0, pickupLockedUntilRaw) : 0,
  };
}

function findStackDrop(tile, tx, ty) {
  for (const drop of drops.values()) {
    if (Number(drop.tile) !== Number(tile)) continue;
    const dropTx = Math.floor(Number(drop.x) / TILE);
    const dropTy = Math.floor(Number(drop.y) / TILE);
    if (dropTx === tx && dropTy === ty) {
      return drop;
    }
  }
  return null;
}

function spawnDropStack(tile, x, y, count = 1, options = {}) {
  const itemId = Number(tile);
  if (!Number.isFinite(itemId)) return;
  const amount = normalizeDropCount(count);
  const pos = normalizeDropPosition(x, y);
  const lockMsRaw = Number(options.pickupDelayMs);
  const pickupDelayMs = Number.isFinite(lockMsRaw) ? Math.max(0, Math.min(5000, Math.floor(lockMsRaw))) : 0;
  const pickupLockedUntil = pickupDelayMs > 0 ? Date.now() + pickupDelayMs : 0;

  if (ONLINE_MODE && networkState.connected) {
    sendSocket({
      type: "drop_spawn",
      tile: itemId,
      x: pos.x,
      y: pos.y,
      count: amount,
      vx: 0,
      vy: 0,
      floatY: pos.y,
      floatTime: 0,
      pickupDelayMs,
    });
    return;
  }

  const existing = findStackDrop(itemId, pos.tx, pos.ty);
  if (existing) {
    existing.count = normalizeDropCount(existing.count) + amount;
    existing.x = pos.x;
    existing.y = pos.y;
    existing.floatY = pos.y;
    existing.floatTime = 0;
    existing.vx = 0;
    existing.vy = 0;
    if (pickupLockedUntil > 0) {
      existing.pickupLockedUntil = Math.max(Number(existing.pickupLockedUntil) || 0, pickupLockedUntil);
    }
    return;
  }

  const drop = normalizeDropRecord({
    id: makeDropId(),
    tile: itemId,
    x: pos.x,
    y: pos.y,
    count: amount,
    floatTime: 0,
    pickupLockedUntil,
  });
  if (!drop) return;
  drops.set(drop.id, drop);
}

// Check if a position is within a locked area (and not owned by current player)
function isPositionLocked(x, y) {
  for (const lock of lockedAreas) {
    const dist = Math.sqrt(Math.pow(x - lock.centerX, 2) + Math.pow(y - lock.centerY, 2));
    if (dist <= lock.radius) {
      // Check if this is the player's own lock
      if (String(lock.userId) === String(networkState.userId)) return false;
      return true; // Locked by another player
    }
  }
  return false; // Not locked
}

const networkState = {
  userId: null,
  username: null,
  socket: null,
  token: localStorage.getItem(TOKEN_KEY) || "",
  connected: false,
  lastPositionSentAt: 0,
  playerId: null, // Session-scoped player id (changes per login)
};

let manualDisconnect = false;
let reconnectTimer = null;
let reconnectAttempts = 0;

let gameplayUnlocked = false;
let worldOwner = null; // Track who owns the world {userId, username}
let settingsState = {
  renderScale: RENDER_SCALE_MEDIUM,
  showReachRing: true,
  showClouds: true,
};

function normalizeRenderScale(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return RENDER_SCALE_MEDIUM;

  // Migrate older saved presets to the current options.
  if (Math.abs(parsed - 0.65) < 0.001) return RENDER_SCALE_LOW;
  if (Math.abs(parsed - 0.8) < 0.001) return RENDER_SCALE_MEDIUM;
  if (Math.abs(parsed - 0.95) < 0.001) return RENDER_SCALE_HIGH;
  if (Math.abs(parsed - 0.75) < 0.001) return RENDER_SCALE_LOW;
  if (Math.abs(parsed - 1) < 0.001) return RENDER_SCALE_MEDIUM;
  if (Math.abs(parsed - 1.25) < 0.001) return RENDER_SCALE_HIGH;

  let nearest = RENDER_SCALE_OPTIONS[0];
  let nearestDelta = Math.abs(parsed - nearest);
  for (const preset of RENDER_SCALE_OPTIONS) {
    const delta = Math.abs(parsed - preset);
    if (delta < nearestDelta) {
      nearest = preset;
      nearestDelta = delta;
    }
  }
  return nearest;
}

function resizeCanvas() {
  const scale = normalizeRenderScale(settingsState.renderScale);
  canvas.width = Math.max(640, Math.floor(window.innerWidth * scale));
  canvas.height = Math.max(360, Math.floor(window.innerHeight * scale));
  ctx.imageSmoothingEnabled = false;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function indexOf(x, y) {
  return y * WORLD_WIDTH + x;
}

function inBounds(x, y) {
  return x >= 0 && x < WORLD_WIDTH && y >= 0 && y < WORLD_HEIGHT;
}

function getTile(x, y) {
  if (!inBounds(x, y)) return 3;
  return world[indexOf(x, y)];
}

function setTile(x, y, type) {
  if (!inBounds(x, y)) return;
  world[indexOf(x, y)] = type;
}

function hashSeed(value) {
  const text = String(value || "default");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededNoise2D(x, y, seed) {
  const value = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233 + (seed + 1) * 0.00173) * 43758.5453123;
  return value - Math.floor(value);
}

function yFromBottom(heightFromBottom) {
  return WORLD_HEIGHT - heightFromBottom;
}

function getGeneratedDoorTile(worldName = WORLD_NAME) {
  const seed = hashSeed(worldName);
  const minDoorX = 2;
  const maxDoorX = WORLD_WIDTH - 3;
  const span = Math.max(1, maxDoorX - minDoorX + 1);
  const roll = seededNoise2D(47, 7, seed + 401);
  const doorX = minDoorX + Math.floor(roll * span);
  return {
    x: doorX,
    y: yFromBottom(DOOR_HEIGHT),
  };
}

function getDoorSpawnPosition(worldName = WORLD_NAME) {
  const door = getGeneratedDoorTile(worldName);
  const spawnOffsetX = (TILE - PLAYER_HITBOX_SIZE) * 0.5;
  const spawnOffsetY = TILE - PLAYER_HITBOX_SIZE;
  return {
    x: door.x * TILE + spawnOffsetX,
    y: Math.max(0, door.y * TILE + spawnOffsetY),
  };
}

function generateWorld(worldName = WORLD_NAME) {
  const seed = hashSeed(worldName);
  world.fill(0);

  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    // 1-5 height: dirt with random lava patches.
    for (let h = LAVA_PATCH_MIN_HEIGHT; h <= LAVA_PATCH_MAX_HEIGHT; h += 1) {
      const y = yFromBottom(h);
      const lavaPatch = seededNoise2D(Math.floor(x / 3), Math.floor(h / 2), seed + 17) < 0.22;
      setTile(x, y, lavaPatch ? LAVA_TILE : 2);
    }

    // 6-40 height: dirt with random stone patches.
    for (let h = STONE_PATCH_MIN_HEIGHT; h <= STONE_PATCH_MAX_HEIGHT; h += 1) {
      const y = yFromBottom(h);
      const stonePatch = seededNoise2D(Math.floor(x / 4), Math.floor(h / 3), seed + 113) < 0.3;
      setTile(x, y, stonePatch ? 3 : 2);
    }

    // 41-45 height: dirt.
    for (let h = DIRT_UPPER_MIN_HEIGHT; h <= DIRT_UPPER_MAX_HEIGHT; h += 1) {
      setTile(x, yFromBottom(h), 2);
    }

    // 46 height: grass surface.
    setTile(x, yFromBottom(GRASS_SURFACE_HEIGHT), 1);

    // 81-max height: air with random cloud patches.
    for (let h = CLOUD_MIN_HEIGHT; h <= WORLD_HEIGHT; h += 1) {
      const y = yFromBottom(h);
      const cloudPatch = seededNoise2D(Math.floor(x / 6), Math.floor(h / 4), seed + 271) < 0.18;
      if (cloudPatch) setTile(x, y, 5);
    }
  }

  // 47 height: one door at a random position.
  const door = getGeneratedDoorTile(worldName);
  setTile(door.x, door.y, 7);
}

generateWorld();

function getGrowthTimeSeconds(rarity) {
  // Rarity 1 = 10 seconds, growth time = 10 * (1.1 ^ rarity)
  return 10 * Math.pow(1.1, rarity);
}

function isSeedItem(itemId) {
  return (itemId >= 9 && itemId <= 14) || itemId === 17;
}

function getSeedGrowingTile(itemId) {
  if (itemId >= 9 && itemId <= 14) {
    return 100 + (itemId - 9);
  }
  if (itemId === 17) return 106;
  return null;
}

function getSeedSourceBlock(itemId) {
  if (itemId >= 9 && itemId <= 14) return itemId - 8;
  if (itemId === 17) return 16;
  return null;
}

function getSeedItemForSourceBlock(sourceBlock) {
  if (sourceBlock >= 1 && sourceBlock <= 6) return sourceBlock + 8;
  if (sourceBlock === 16) return 17;
  return null;
}

function getGrowingTileForSourceBlock(sourceBlock) {
  const seedItem = getSeedItemForSourceBlock(sourceBlock);
  if (seedItem === null) return null;
  return getSeedGrowingTile(seedItem);
}

const seedCombinationRecipes = new Map([
  ["1:2", 4], // Grass + Dirt -> Wood
]);

function getSeedCombinationResult(existingSourceBlock, newSeedSourceBlock) {
  const low = Math.min(existingSourceBlock, newSeedSourceBlock);
  const high = Math.max(existingSourceBlock, newSeedSourceBlock);
  return seedCombinationRecipes.get(`${low}:${high}`) ?? null;
}

function getItemRarity(itemId) {
  return itemDefs[itemId]?.rarity || 1;
}

const initialSpawn = getDoorSpawnPosition();

const player = {
  x: initialSpawn.x,
  y: initialSpawn.y,
  w: PLAYER_HITBOX_SIZE,
  h: PLAYER_HITBOX_SIZE,
  vx: 0,
  vy: 0,
  speed: 190,
  jump: JUMP_MAX_VELOCITY,
  onGround: false,
  facing: 1,
  reach: 3.5,
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  punchUntil: 0,
  nextPunchAt: 0,
  lastLavaHitAt: 0,
  knockbackUntil: 0,
  pendingNudgeX: 0,
  pendingNudgeY: 0,
  pendingNudgeTime: 0,
  animDirection: "right",
  isMoving: false,
};

const camera = {
  x: 0,
  y: 0,
  smooth: 0.2,
};

const keys = new Set();
let mouseX = 0;
let mouseY = 0;
let leftDown = false;
let suppressBreakUntil = 0;
let currentNow = performance.now();
let digitCombo = "";
let digitComboExpiresAt = 0;
let chatRecentlyClosed = false;
let jumpHeldLastFrame = false;

function isChatFocused() {
  const active = document.activeElement;
  return active === chatInput || active === friendsMessageInput || active === friendSearchInput;
}

function getChatDurationMs(text) {
  const base = 5000;
  const perChar = 50;
  const maxDuration = 15000;
  return Math.min(maxDuration, base + text.length * perChar);
}

function addChatBubble(playerId, text) {
  if (!playerId || !text) return;
  const now = performance.now();
  chatBubbles.set(String(playerId), {
    text,
    expiresAt: now + getChatDurationMs(text),
  });
}

const breakState = {
  targetX: -1,
  targetY: -1,
  progress: 0,
};

const textureCache = new Map();
let assetManifestVersion = ASSET_VERSION;
let assetManifestEntries = new Map();
let assetManifestTimer = null;
let assetManifestFetchWarned = false;
const PLAYER_SPRITE_FRAME_SIZE = 32;
const PLAYER_SPRITE_FRAMES = 8;
const PLAYER_SPRITE_FPS = 12;
const PLAYER_SPRITE_PRELOAD_TIMEOUT_MS = 2200;
const PLAYER_SPRITES = {
  right: "Journals/walking right.png",
  left: "Journals/walking left.png",
  down: "Journals/walking down.png",
  up: "Journals/walikng up.png",
};
let playerSpritePreloadPromise = null;
let playerSpritePreloadFinished = false;

function waitForTextureReady(image, timeoutMs = PLAYER_SPRITE_PRELOAD_TIMEOUT_MS) {
  return new Promise((resolve) => {
    if (!image) {
      resolve(false);
      return;
    }

    if (image.complete) {
      resolve(image.naturalWidth > 0 && image.naturalHeight > 0);
      return;
    }

    let settled = false;
    let timeoutId = 0;

    function cleanup() {
      image.removeEventListener("load", handleLoad);
      image.removeEventListener("error", handleError);
      if (timeoutId) clearTimeout(timeoutId);
    }

    function finish(ok) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(ok);
    }

    function handleLoad() {
      finish(image.naturalWidth > 0 && image.naturalHeight > 0);
    }

    function handleError() {
      finish(false);
    }

    image.addEventListener("load", handleLoad);
    image.addEventListener("error", handleError);
    timeoutId = window.setTimeout(() => {
      finish(image.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
    }, timeoutMs);
  });
}

function preloadPlayerSprites() {
  if (playerSpritePreloadPromise) return playerSpritePreloadPromise;

  const spriteSources = Object.values(PLAYER_SPRITES);
  playerSpritePreloadPromise = Promise.all(
    spriteSources.map((source) => waitForTextureReady(getTexture(source)))
  )
    .then((results) => {
      if (results.some((loaded) => !loaded)) {
        console.warn("Some player sprite frames failed to preload.");
      }
      return results.every(Boolean);
    })
    .catch((err) => {
      console.warn("Player sprite preload failed.", err);
      return false;
    })
    .finally(() => {
      playerSpritePreloadFinished = true;
    });

  return playerSpritePreloadPromise;
}

function setAuthMessage(message) {
  if (authMessageEl) {
    authMessageEl.textContent = message;
  }
}

function updateWorldOwnerDisplay() {
  const worldOwnerEl = document.getElementById("worldOwnerDisplay");
  if (!worldOwnerEl) return;
  
  if (!worldOwner || !worldOwner.username) {
    worldOwnerEl.classList.add("hidden");
    return;
  }
  
  const isOwner = String(worldOwner.userId) === String(networkState.userId);
  if (isOwner) {
    worldOwnerEl.textContent = `🔒 ${worldOwner.username}'s World`;
    worldOwnerEl.classList.remove("hidden");
  } else {
    worldOwnerEl.classList.add("hidden");
  }
}

function setOnlineBadge(isOnline, text) {
  if (!onlineStateEl) return;
  onlineStateEl.classList.toggle("online", isOnline);
  onlineStateEl.classList.toggle("offline", !isOnline);
  onlineStateEl.textContent = text;
}

function hideMenuLayers() {
  menuModal?.classList.add("hidden");
  settingsModal?.classList.add("hidden");
}

function showSettingsModal() {
  menuModal?.classList.add("hidden");
  settingsModal?.classList.remove("hidden");
}

function redirectToLogin(reason) {
  manualDisconnect = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (reason) {
    sessionStorage.setItem("agetopia_login_notice", reason);
  }
  window.location.href = LOGIN_PAGE;
}

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    settingsState = {
      renderScale: normalizeRenderScale(saved.renderScale),
      showReachRing: saved.showReachRing !== false,
      showClouds: saved.showClouds !== false,
    };
  } catch {
    settingsState = { renderScale: RENDER_SCALE_MEDIUM, showReachRing: true, showClouds: true };
  }

  if (graphicsScaleEl) graphicsScaleEl.value = String(settingsState.renderScale);
  if (toggleReachRingEl) toggleReachRingEl.checked = settingsState.showReachRing;
  if (toggleCloudsEl) toggleCloudsEl.checked = settingsState.showClouds;
  resizeCanvas();
}

function saveInventoryState() {
  const isOpen = !inventoryModal?.classList.contains("hidden");
  localStorage.setItem(INVENTORY_STATE_KEY, isOpen ? "true" : "false");
}

function loadInventoryState() {
  try {
    const isOpen = localStorage.getItem(INVENTORY_STATE_KEY) === "true";
    if (isOpen) {
      inventoryModal?.classList.remove("hidden");
    } else {
      inventoryModal?.classList.add("hidden");
    }
  } catch {
    inventoryModal?.classList.add("hidden");
  }
}

function getInventoryStorageKey() {
  const username = networkState.username || localStorage.getItem(LAST_USERNAME_KEY) || "guest";
  return `${INVENTORY_ITEMS_KEY}:${username}`;
}

function saveInventoryItems() {
  try {
    localStorage.setItem(getInventoryStorageKey(), JSON.stringify(inventory));
    if (ONLINE_MODE && networkState.connected) {
      // Send inventory to server so it persists across devices
      const payload = {};
      const validKeys = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
      validKeys.forEach((k) => { payload[k] = Math.max(0, Math.min(INVENTORY_STACK_LIMIT, inventory[k] || 0)); });
      sendSocket({ type: "inventory_update", inventory: payload });
    }
  } catch (err) {
    console.error("Failed to save inventory", err);
  }
}

function loadInventoryItems() {
  try {
    const key = getInventoryStorageKey();
    let saved = localStorage.getItem(key);

    // One-time migration from old keys
    if (!saved) {
      const legacy = localStorage.getItem(INVENTORY_ITEMS_KEY);
      const username = networkState.username || localStorage.getItem(LAST_USERNAME_KEY) || "guest";
      const legacyPerWorld = localStorage.getItem(`${INVENTORY_ITEMS_KEY}:${username}:${WORLD_NAME}`);
      const picked = legacyPerWorld || legacy;
      if (picked) {
        saved = picked;
        localStorage.setItem(key, picked);
        if (legacy) localStorage.removeItem(INVENTORY_ITEMS_KEY);
        if (legacyPerWorld) localStorage.removeItem(`${INVENTORY_ITEMS_KEY}:${username}:${WORLD_NAME}`);
      }
    }
    if (saved) {
      const loaded = JSON.parse(saved);
      
      if (saved) {
        for (let item = 1; item <= 6; item++) {
          inventory[item] = Math.min(INVENTORY_STACK_LIMIT, loaded[item] || 0);
        }
        inventory[8] = Math.min(INVENTORY_STACK_LIMIT, loaded[8] || 0);
        for (let seed = 9; seed <= 14; seed++) {
          inventory[seed] = Math.min(INVENTORY_STACK_LIMIT, loaded[seed] || 0);
        }
        inventory[15] = Math.min(INVENTORY_STACK_LIMIT, loaded[15] || 0);
        inventory[16] = Math.min(INVENTORY_STACK_LIMIT, loaded[16] || 0);
        inventory[17] = Math.min(INVENTORY_STACK_LIMIT, loaded[17] || 0);
      }
    }
  } catch (err) {
    console.error("Failed to load inventory", err);
  }
  
  // Remove ALL keys that aren't in the valid list
  const validKeys = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  for (const key in inventory) {
    const numKey = parseInt(key);
    if (!validKeys.includes(numKey)) {
      console.warn("Removing invalid inventory key:", key);
      delete inventory[key];
    }
  }
  
  // Save updated inventory to persist
  saveInventoryItems();
}

function applyInventoryFromServer(serverInv) {
  if (!serverInv || typeof serverInv !== "object") {
    loadInventoryItems();
    return;
  }
  
  // Clear current inventory
  const validIds = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  validIds.forEach((k) => { inventory[k] = 0; });
  
  // Apply server inventory (handle both ID-based legacy and name-based formats)
  for (const [key, value] of Object.entries(serverInv)) {
    let itemId = null;
    
    // Check if key is a numeric ID (legacy format)
    if (!isNaN(key)) {
      itemId = Number(key);
    } else {
      // Try to look up by item name (new format)
      itemId = ITEM_NAME_TO_ID[key];
    }
    
    if (itemId && validIds.includes(itemId)) {
      const val = Number(value);
      if (Number.isFinite(val) && val >= 0) {
        inventory[itemId] = Math.min(INVENTORY_STACK_LIMIT, Math.floor(val));
      } else {
        inventory[itemId] = 0;
      }
    }
  }
  
  // Persist to per-user storage for offline continuity
  saveInventoryItems();
}

function saveGrowingPlants() {
  try {
    const plants = Array.from(growingPlants.entries()).map(([key, plant]) => ({
      key,
      ...plant
    }));
    localStorage.setItem(GROWING_PLANTS_KEY, JSON.stringify(plants));
  } catch (err) {
    console.error("Failed to save growing plants", err);
  }
}

function loadGrowingPlants() {
  try {
    const saved = localStorage.getItem(GROWING_PLANTS_KEY);
    if (saved) {
      const plants = JSON.parse(saved);
      plants.forEach(p => {
        growingPlants.set(p.key, {
          progress: 0,
          totalTime: p.totalTime,
          dropCount: p.dropCount,
          sourceBlock: p.sourceBlock,
          fullGrown: p.fullGrown || false,
          plantedAt: p.plantedAt
        });
      });
    }
  } catch (err) {
    console.error("Failed to load growing plants", err);
  }
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsState));
}

function applySettingsFromControls() {
  settingsState.renderScale = normalizeRenderScale(graphicsScaleEl?.value);
  settingsState.showReachRing = !!toggleReachRingEl?.checked;
  settingsState.showClouds = !!toggleCloudsEl?.checked;
  saveSettings();
  resizeCanvas();
}

function performLogout() {
  manualDisconnect = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  localStorage.removeItem(TOKEN_KEY);
  networkState.token = "";
  networkState.username = null;
  networkState.userId = null;
  networkState.playerId = null;
  lockGameplay();
  remotePlayers.clear();
  networkState.socket?.close();
  redirectToLogin("Logged out.");
}

function hideMenuAndSettings() {
  menuModal?.classList.add("hidden");
  settingsModal?.classList.add("hidden");
}

function exitWorld() {
  manualDisconnect = true;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;
  hideMenuAndSettings();
  saveInventoryItems();
  networkState.socket?.close();
  remotePlayers.clear();
  lockGameplay();
  window.location.href = `${WORLD_PAGE}?online=1`;
}

function setupMenuInteractions() {
  menuBtn?.addEventListener("click", () => {
    const willShow = menuModal?.classList.contains("hidden");
    if (willShow) {
      menuModal?.classList.remove("hidden");
      settingsModal?.classList.add("hidden");
    } else {
      hideMenuLayers();
    }
  });

  menuSettingsBtn?.addEventListener("click", () => {
    showSettingsModal();
  });

  menuExitBtn?.addEventListener("click", () => {
    exitWorld();
  });

  menuLogoutBtn?.addEventListener("click", () => {
    performLogout();
  });

  settingsCloseBtn?.addEventListener("click", () => {
    settingsModal?.classList.add("hidden");
  });

  graphicsScaleEl?.addEventListener("change", applySettingsFromControls);
  toggleReachRingEl?.addEventListener("change", applySettingsFromControls);
  toggleCloudsEl?.addEventListener("change", applySettingsFromControls);

  window.addEventListener("keydown", (event) => {
    if (event.code === "Escape") hideMenuLayers();
  });

  document.addEventListener("mousedown", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const clickedMenu = menuModal?.contains(target) || menuBtn?.contains(target);
    const clickedSettings = settingsModal?.contains(target);
    const clickedInventory = inventoryModal?.contains(target) || inventoryBtn?.contains(target);
    if (!clickedMenu && !clickedSettings && !clickedInventory) {
      hideMenuLayers();
    }
  });

  // Punch button click
  btnPunch?.addEventListener("click", () => {
    selectedSlot = -1; // -1 means punch mode
    updateHUD();
  });

  // Expand inventory button
  inventoryExpandBtn?.addEventListener("click", () => {
    inventoryModal?.classList.remove("hidden");
    menuModal?.classList.add("hidden");
    settingsModal?.classList.add("hidden");
    saveInventoryState();
  });

  inventoryCloseBtn?.addEventListener("click", () => {
    inventoryModal?.classList.add("hidden");
    dropModal?.classList.add("hidden");
    saveInventoryState();
  });

  // Event delegation for quick slot clicks
  if (quickSlotsEl) {
    quickSlotsEl.addEventListener("mousedown", (event) => {
      event.stopPropagation();
      const slot = event.target.closest(".quick-slot");
      if (!slot) return;
      
      const slotIndex = Number(slot.getAttribute("data-slot-index"));
      if (isNaN(slotIndex) || slotIndex < 0 || slotIndex >= 5) return;
      
      selectedSlot = slotIndex;
      updateHUD();
    });
  }

  // Event delegation for full inventory slot clicks
  if (inventoryEl) {
    inventoryEl.addEventListener("mousedown", (event) => {
      event.stopPropagation();  // Prevent document mousedown from firing
      const slot = event.target.closest(".slot");
      if (!slot) return;
      
      const slotIndex = Number(slot.getAttribute("data-slot-index"));
      const tileAttr = Number(slot.getAttribute("data-tile"));
      if (!Number.isNaN(slotIndex) && slotIndex >= 0 && slotIndex < hotbarOrder.length) {
        selectedSlot = slotIndex;
        selectedInventoryTile = hotbarOrder[slotIndex];
      } else if (!Number.isNaN(tileAttr)) {
        selectedInventoryTile = tileAttr;
      }
      updateHUD();
    });
  }

  // Drop button handlers
  dropBtn?.addEventListener("click", () => {
    if (selectedInventoryTile === null) {
      setAuthMessage("Select an item first");
      return;
    }
    const count = inventory[selectedInventoryTile] || 0;
    if (count <= 0) {
      setAuthMessage("No items to drop");
      return;
    }
    if (dropItemLabel) {
      const name = (itemDefs[selectedInventoryTile] || tileDefs[selectedInventoryTile] || {}).name || "Item";
      dropItemLabel.textContent = `${name} available: ${count}`;
    }
    if (dropAmountInput) {
      dropAmountInput.value = "1";
      dropAmountInput.max = String(count);
      dropAmountInput.focus();
      dropAmountInput.select();
    }
    dropModal?.classList.remove("hidden");
  });

  const closeDropModal = () => {
    dropModal?.classList.add("hidden");
  };

  dropCancelBtn?.addEventListener("click", closeDropModal);

  dropConfirmBtn?.addEventListener("click", () => {
    const raw = dropAmountInput ? Number(dropAmountInput.value) : 0;
    performDrop(raw);
    closeDropModal();
  });
}

function setupChatUI() {
  if (!chatToggleBtn || !chatBar || !chatInput || !chatSendBtn) return;

  const openChat = () => {
    chatBar.classList.remove("hidden");
    chatInput.focus();
    keys.clear();
    leftDown = false;
    chatRecentlyClosed = false;
  };

  const closeChat = () => {
    chatBar.classList.add("hidden");
    chatInput.blur();
    chatRecentlyClosed = true;
    setTimeout(() => { chatRecentlyClosed = false; }, 80);
  };

  chatToggleBtn.addEventListener("click", () => {
    const isOpen = !chatBar.classList.contains("hidden");
    if (isOpen) {
      closeChat();
    } else {
      openChat();
    }
  });

  chatSendBtn.addEventListener("click", () => {
    sendChatMessage();
    closeChat();
  });

  chatInput.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      sendChatMessage();
      closeChat();
      e.stopPropagation();
    } else if (e.code === "Escape") {
      e.preventDefault();
      closeChat();
      e.stopPropagation();
    }
  });

  // Allow opening chat via Enter when hidden
  window.addEventListener("keydown", (e) => {
    if (e.code === "Enter" && chatBar.classList.contains("hidden") && !isChatFocused() && !chatRecentlyClosed) {
      e.preventDefault();
      openChat();
      return;
    }

    // If chat is open but not focused (rare), Enter will close it to avoid trapping focus
    if (e.code === "Enter" && !chatBar.classList.contains("hidden") && !isChatFocused()) {
      e.preventDefault();
      closeChat();
    }
  });

  const updateChatHistoryToggle = () => {
    if (!chatHistoryToggle || !chatHistoryPanel) return;
    const collapsed = chatHistoryPanel.classList.contains("collapsed");
    chatHistoryToggle.textContent = collapsed ? "Open" : "Close";
    chatHistoryToggle.setAttribute("aria-expanded", String(!collapsed));
  };

  chatHistoryToggle?.addEventListener("click", () => {
    chatHistoryPanel?.classList.toggle("collapsed");
    updateChatHistoryToggle();
  });

  updateChatHistoryToggle();
}

function setupFriendsChatUI() {
  if (!friendsChatToggle || !friendsChatPanel) return;

  friendsChatToggle.addEventListener("click", () => {
    toggleFriendsChat();
  });

  friendsChatClose?.addEventListener("click", () => {
    toggleFriendsChat(false);
  });

  friendSearchBtn?.addEventListener("click", () => {
    const q = friendSearchInput?.value?.trim();
    if (q) sendSocket({ type: "friend_search", query: q });
  });

  friendSearchInput?.addEventListener("input", () => {
    const q = friendSearchInput.value.trim();
    if (friendSearchDebounce) clearTimeout(friendSearchDebounce);
    friendSearchDebounce = window.setTimeout(() => {
      if (q.length >= 2) {
        sendSocket({ type: "friend_search", query: q });
      }
    }, 220);
  });

  friendsMessageSend?.addEventListener("click", () => {
    const text = friendsMessageInput?.value?.trim();
    if (!text || !friendsState.activePairId) return;
    sendSocket({ type: "friend_chat_send", pairId: friendsState.activePairId, text });
    friendsMessageInput.value = "";
  });

  friendsMessageInput?.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      friendsMessageSend?.click();
    }
  });
}

function normalizeChatTimestamp(ts) {
  if (!ts) return Date.now();
  const stamped = ts.includes("T") ? ts : `${ts.replace(" ", "T")}Z`;
  const parsed = Date.parse(stamped);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function pruneChatHistory() {
  const cutoff = Date.now() - CHAT_HISTORY_WINDOW_MS;
  let removed = false;
  for (let i = chatHistory.length - 1; i >= 0; i -= 1) {
    const entry = chatHistory[i];
    const createdAtMs = entry.createdAtMs ?? normalizeChatTimestamp(entry.createdAt);
    entry.createdAtMs = createdAtMs;
    if (createdAtMs < cutoff) {
      if (entry.chatId) chatHistoryIds.delete(entry.chatId);
      chatHistory.splice(i, 1);
      removed = true;
    }
  }
  return removed;
}

function renderChatHistory() {
  if (!chatHistoryList) return;
  pruneChatHistory();
  chatHistoryList.innerHTML = "";

  if (chatHistory.length === 0) {
    const empty = document.createElement("div");
    empty.className = "chat-history-empty";
    empty.textContent = "No messages yet";
    chatHistoryList.appendChild(empty);
    return;
  }

  const recent = chatHistory.slice(-50);
  recent.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "chat-history-row";

    const user = document.createElement("span");
    user.className = "chat-history-user";
    user.textContent = `${entry.username || "Player"}:`;

    const message = document.createElement("span");
    message.className = "chat-history-message";
    message.textContent = entry.text;

    row.appendChild(user);
    row.appendChild(message);
    chatHistoryList.appendChild(row);
  });

  chatHistoryList.scrollTop = chatHistoryList.scrollHeight;
}

function addChatHistoryEntry(entry, { skipRender = false } = {}) {
  const text = (entry.text || "").toString().trim();
  if (!text) return;

  const chatId = entry.chatId != null ? String(entry.chatId) : null;
  if (chatId && chatHistoryIds.has(chatId)) return;

  const createdAtMs = entry.createdAtMs || normalizeChatTimestamp(entry.createdAt);
  chatHistory.push({
    chatId,
    username: (entry.username || "Player").toString(),
    text,
    createdAt: entry.createdAt || new Date(createdAtMs).toISOString(),
    createdAtMs,
  });
  if (chatId) chatHistoryIds.add(chatId);

  const pruned = pruneChatHistory();
  if (!skipRender || pruned) {
    renderChatHistory();
  }
}

function bootChatHistoryPruner() {
  if (chatPruneTimer) return;
  chatPruneTimer = window.setInterval(() => {
    if (pruneChatHistory()) {
      renderChatHistory();
    }
  }, 30000);
}

function renderFriendSearchResults() {
  if (!friendSearchResults) return;
  friendSearchResults.innerHTML = "";
  if (friendsState.searchResults.length === 0) {
    const empty = document.createElement("div");
    empty.className = "friend-search-empty";
    empty.textContent = "No players found";
    friendSearchResults.appendChild(empty);
    return;
  }
  friendsState.searchResults.forEach((user) => {
    const row = document.createElement("div");
    row.className = "friend-search-row";
    const name = document.createElement("span");
    name.className = "name";
    name.textContent = user.username;
    const btn = document.createElement("button");
    btn.className = "friend-action-btn";
    btn.textContent = "Add";
    btn.addEventListener("click", () => {
      sendSocket({ type: "friend_request", userId: user.id });
    });
    row.appendChild(name);
    row.appendChild(btn);
    friendSearchResults.appendChild(row);
  });
}

function setActiveFriend(pairId) {
  friendsState.activePairId = pairId;
  renderFriendsList();
  renderFriendMessages();
  if (pairId && ONLINE_MODE && networkState.connected) {
    sendSocket({ type: "friend_history", pairId });
  }
}

function renderFriendsList() {
  if (!friendsListEl) return;
  friendsListEl.innerHTML = "";
  if (!friendsState.pairs.length) {
    const empty = document.createElement("div");
    empty.className = "friend-empty";
    empty.textContent = "No friends yet";
    friendsListEl.appendChild(empty);
    return;
  }

  friendsState.pairs.forEach((pair) => {
    const row = document.createElement("div");
    row.className = `friend-row ${pair.status}`;
    const meta = document.createElement("div");
    meta.className = "name";
    meta.textContent = pair.friendUsername || "Player";
    const status = document.createElement("div");
    status.className = "status";
    status.textContent = pair.status === "accepted" ? "Friends" : "Pending";
    const btnWrap = document.createElement("div");

    if (pair.status === "pending" && String(pair.friendUserId) === String(pair.requestedBy)) {
      // We received the request
      const acceptBtn = document.createElement("button");
      acceptBtn.className = "friend-action-btn";
      acceptBtn.textContent = "Accept";
      acceptBtn.addEventListener("click", () => {
        sendSocket({ type: "friend_accept", pairId: pair.pairId, userId: pair.friendUserId });
      });
      btnWrap.appendChild(acceptBtn);
    } else if (pair.status === "accepted") {
      const openBtn = document.createElement("button");
      openBtn.className = "friend-action-btn secondary";
      openBtn.textContent = "Open";
      openBtn.addEventListener("click", () => setActiveFriend(pair.pairId));
      btnWrap.appendChild(openBtn);
    } else {
      const pending = document.createElement("span");
      pending.className = "status";
      pending.textContent = "Request sent";
      btnWrap.appendChild(pending);
    }

    row.appendChild(meta);
    row.appendChild(status);
    row.appendChild(btnWrap);
    friendsListEl.appendChild(row);
  });
}

function renderFriendMessages() {
  if (!friendsMessagesEl) return;
  friendsMessagesEl.innerHTML = "";
  const pairId = friendsState.activePairId;
  if (!pairId) {
    friendsConversationHeader.textContent = "Select a friend to chat";
    return;
  }
  const pair = friendsState.pairs.find((p) => p.pairId === pairId);
  if (pair) {
    friendsConversationHeader.textContent = pair.friendUsername || "Friend";
  }
  const msgs = friendsState.messages.get(pairId) || [];
  if (!msgs.length) {
    const empty = document.createElement("div");
    empty.className = "friend-empty";
    empty.textContent = "No messages yet";
    friendsMessagesEl.appendChild(empty);
    return;
  }
  msgs.forEach((m) => {
    const row = document.createElement("div");
    row.className = `friend-message-row ${String(m.senderId) === String(networkState.userId) ? "me" : ""}`;
    const meta = document.createElement("div");
    meta.className = "friend-message-meta";
    const createdAtMs = normalizeChatTimestamp(m.createdAt || m.createdAtMs || m.created_at || Date.now());
    const time = new Date(createdAtMs);
    meta.textContent = `${String(m.senderId) === String(networkState.userId) ? "You" : pair?.friendUsername || "Friend"} • ${time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    const body = document.createElement("div");
    body.textContent = m.message;
    row.appendChild(meta);
    row.appendChild(body);
    friendsMessagesEl.appendChild(row);
  });
  friendsMessagesEl.scrollTop = friendsMessagesEl.scrollHeight;
}

function addFriendMessages(pairId, newMessages) {
  if (!pairId) return;
  if (!friendsState.messages.has(pairId)) friendsState.messages.set(pairId, []);
  const arr = friendsState.messages.get(pairId);
  newMessages.forEach((msg) => {
    const stamped = normalizeChatTimestamp(msg.createdAt || msg.createdAtMs || msg.created_at || msg.created_at_ms);
    const normalized = { ...msg, createdAtMs: stamped };
    arr.push(normalized);
  });
  arr.sort((a, b) => {
    const aTs = typeof a.createdAtMs === "number" ? a.createdAtMs : normalizeChatTimestamp(a.createdAt || a.created_at);
    const bTs = typeof b.createdAtMs === "number" ? b.createdAtMs : normalizeChatTimestamp(b.createdAt || b.created_at);
    return aTs - bTs;
  });
  if (friendsState.activePairId === pairId) {
    renderFriendMessages();
  }
}

function toggleFriendsChat(open) {
  if (!friendsChatPanel) return;
  const shouldOpen = open !== undefined ? open : friendsChatPanel.classList.contains("hidden");
  if (shouldOpen) {
    friendsChatPanel.classList.remove("hidden");
    friendsMessageInput?.focus();
  } else {
    friendsChatPanel.classList.add("hidden");
  }
}

function unlockGameplay() {
  gameplayUnlocked = true;
  document.body.classList.add("authenticated");
}

function lockGameplay() {
  gameplayUnlocked = false;
  document.body.classList.remove("authenticated");
}

async function apiRequest(path, method, payload, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(path, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

function normalizeAssetPath(src) {
  return String(src || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .split("?")[0];
}

function isManagedAssetPath(src) {
  return MANAGED_ASSET_PREFIXES.some((prefix) => src.startsWith(prefix));
}

function getVersionedAssetPath(src) {
  if (!src) return src;
  const raw = String(src);
  if (/^(data:|blob:|https?:|\/\/)/i.test(raw)) return raw;

  const normalized = normalizeAssetPath(raw);
  if (!normalized) return raw;
  if (!isManagedAssetPath(normalized)) return normalized;

  const version = assetManifestEntries.get(normalized) || assetManifestVersion;
  if (!version) return normalized;
  return `${normalized}?v=${encodeURIComponent(String(version))}`;
}

async function refreshAssetManifest() {
  try {
    const response = await fetch(`/api/assets/manifest?t=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") return;

    const nextVersion = String(data.version || assetManifestVersion || ASSET_VERSION);
    const nextEntries = new Map();
    if (data.assets && typeof data.assets === "object") {
      for (const [assetPath, version] of Object.entries(data.assets)) {
        const normalized = normalizeAssetPath(assetPath);
        if (!normalized || !isManagedAssetPath(normalized)) continue;
        nextEntries.set(normalized, String(version));
      }
    }

    let changed = nextVersion !== assetManifestVersion || nextEntries.size !== assetManifestEntries.size;
    if (!changed) {
      for (const [assetPath, version] of nextEntries.entries()) {
        if (assetManifestEntries.get(assetPath) !== version) {
          changed = true;
          break;
        }
      }
    }

    if (!changed) return;

    assetManifestVersion = nextVersion;
    assetManifestEntries = nextEntries;
    textureCache.clear();
    updateHUD();
  } catch (err) {
    if (!assetManifestFetchWarned) {
      console.warn("Asset manifest sync unavailable, using cached textures.", err);
      assetManifestFetchWarned = true;
    }
  }
}

function startAssetManifestSync() {
  if (assetManifestTimer) return;
  assetManifestTimer = window.setInterval(() => {
    refreshAssetManifest().catch(() => {});
  }, ASSET_MANIFEST_REFRESH_MS);
}

function getTexture(src) {
  if (!src) return null;
  const resolvedSrc = getVersionedAssetPath(src);
  if (textureCache.has(resolvedSrc)) return textureCache.get(resolvedSrc);

  const img = new Image();
  img.decoding = "async";
  img.src = resolvedSrc;
  textureCache.set(resolvedSrc, img);
  return img;
}

function drawBlockTexture(tileId, def, drawX, drawY) {
  const primaryTexture = def?.texture || itemDefs[tileId]?.icon || null;
  const primaryImg = getTexture(primaryTexture);
  if (primaryImg && primaryImg.complete && primaryImg.naturalWidth > 0) {
    ctx.drawImage(primaryImg, drawX, drawY, TILE, TILE);
    return;
  }

  // Fallback: if block texture fails, try item icon for the same tile.
  const iconTexture = itemDefs[tileId]?.icon || null;
  if (iconTexture && iconTexture !== primaryTexture) {
    const iconImg = getTexture(iconTexture);
    if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
      ctx.drawImage(iconImg, drawX, drawY, TILE, TILE);
      return;
    }
  }

  ctx.fillStyle = def.color;
  ctx.fillRect(drawX, drawY, TILE, TILE);
}

function isSolid(tileType) {
  return tileDefs[tileType]?.solid ?? true;
}

function rectIntersectsSolid(x, y, w, h) {
  const left = Math.floor(x / TILE);
  const right = Math.floor((x + w - 1) / TILE);
  const top = Math.floor(y / TILE);
  const bottom = Math.floor((y + h - 1) / TILE);

  for (let ty = top; ty <= bottom; ty += 1) {
    for (let tx = left; tx <= right; tx += 1) {
      if (isSolid(getTile(tx, ty))) {
        return true;
      }
    }
  }
  return false;
}

function getPlayerTileBounds() {
  const left = Math.floor(player.x / TILE);
  const right = Math.floor((player.x + player.w - 1) / TILE);
  const top = Math.floor(player.y / TILE);
  const bottom = Math.floor((player.y + player.h - 1) / TILE);
  return { left, right, top, bottom };
}

function movePlayerAxis(axis, delta, stopVelocityOnCollision = true) {
  if (!delta) return 0;

  const isX = axis === "x";
  const target = (isX ? player.x : player.y) + delta;
  const directX = isX ? target : player.x;
  const directY = isX ? player.y : target;
  if (!rectIntersectsSolid(directX, directY, player.w, player.h)) {
    if (isX) {
      player.x = target;
    } else {
      player.y = target;
    }
    return delta;
  }

  const direction = Math.sign(delta) || 0;
  if (direction === 0) return 0;

  let moved = 0;
  const wholeSteps = Math.floor(Math.abs(delta));
  for (let i = 0; i < wholeSteps; i += 1) {
    const nextX = isX ? player.x + direction : player.x;
    const nextY = isX ? player.y : player.y + direction;
    if (rectIntersectsSolid(nextX, nextY, player.w, player.h)) {
      break;
    }
    if (isX) {
      player.x += direction;
    } else {
      player.y += direction;
    }
    moved += direction;
  }

  const remainder = Math.abs(delta) - wholeSteps;
  if (remainder > 0) {
    const fracStep = direction * remainder;
    const nextX = isX ? player.x + fracStep : player.x;
    const nextY = isX ? player.y : player.y + fracStep;
    if (!rectIntersectsSolid(nextX, nextY, player.w, player.h)) {
      if (isX) {
        player.x += fracStep;
      } else {
        player.y += fracStep;
      }
      moved += fracStep;
    }
  }

  if (stopVelocityOnCollision && moved !== delta) {
    if (isX) {
      player.vx = 0;
    } else {
      if (delta > 0) player.onGround = true;
      player.vy = 0;
    }
  }

  return moved;
}

function queueSmoothNudge(dx, dy, durationSeconds = KNOCKBACK_NUDGE_DURATION) {
  const safeDx = Number.isFinite(dx) ? dx : 0;
  const safeDy = Number.isFinite(dy) ? dy : 0;
  if (Math.abs(safeDx) < 0.01 && Math.abs(safeDy) < 0.01) return;

  const duration = Math.max(0.05, Number(durationSeconds) || KNOCKBACK_NUDGE_DURATION);
  player.pendingNudgeX += safeDx;
  player.pendingNudgeY += safeDy;
  player.pendingNudgeTime = Math.max(player.pendingNudgeTime, duration);
}

function applyQueuedNudge(dt) {
  if (player.pendingNudgeTime <= 0) return;

  const stepTime = Math.min(dt, player.pendingNudgeTime);
  const ratio = stepTime / Math.max(player.pendingNudgeTime, 0.0001);
  const moveX = player.pendingNudgeX * ratio;
  const moveY = player.pendingNudgeY * ratio;

  player.pendingNudgeX -= moveX;
  player.pendingNudgeY -= moveY;
  player.pendingNudgeTime -= stepTime;

  movePlayerAxis("x", moveX, false);
  movePlayerAxis("y", moveY, false);

  if (player.pendingNudgeTime <= 0.0001) {
    if (Math.abs(player.pendingNudgeX) > 0.001) {
      movePlayerAxis("x", player.pendingNudgeX, false);
    }
    if (Math.abs(player.pendingNudgeY) > 0.001) {
      movePlayerAxis("y", player.pendingNudgeY, false);
    }
    player.pendingNudgeX = 0;
    player.pendingNudgeY = 0;
    player.pendingNudgeTime = 0;
  }
}

function resolvePlayerOverlap() {
  if (!rectIntersectsSolid(player.x, player.y, player.w, player.h)) return false;

  const originX = player.x;
  const originY = player.y;
  for (let radius = UNSTICK_SEARCH_STEP; radius <= UNSTICK_SEARCH_RADIUS; radius += UNSTICK_SEARCH_STEP) {
    const candidates = [
      [0, -radius],
      [0, radius],
      [-radius, 0],
      [radius, 0],
      [-radius, -radius],
      [radius, -radius],
      [-radius, radius],
      [radius, radius],
    ];

    for (const [offsetX, offsetY] of candidates) {
      const testX = originX + offsetX;
      const testY = originY + offsetY;
      if (rectIntersectsSolid(testX, testY, player.w, player.h)) continue;

      player.x = testX;
      player.y = testY;
      player.vx *= 0.4;
      if (player.vy > 0) player.vy = 0;
      return true;
    }
  }

  return false;
}

function moveWithCollisions(dt) {
  const deltaX = player.vx * dt;
  const deltaY = player.vy * dt;
  movePlayerAxis("x", deltaX, true);
  const movedY = movePlayerAxis("y", deltaY, true);
  if (deltaY !== 0 && movedY === deltaY) {
    player.onGround = false;
  }
}

function screenToWorldTile(sx, sy) {
  const worldX = sx + camera.x;
  const worldY = sy + camera.y;
  return {
    tx: Math.floor(worldX / TILE),
    ty: Math.floor(worldY / TILE),
  };
}

function tileCenterDistanceToPlayer(tx, ty) {
  const cx = tx * TILE + TILE * 0.5;
  const cy = ty * TILE + TILE * 0.5;
  const px = player.x + player.w * 0.5;
  const py = player.y + player.h * 0.5;
  return Math.hypot(cx - px, cy - py) / TILE;
}

function canReach(tx, ty) {
  return tileCenterDistanceToPlayer(tx, ty) <= player.reach;
}

function worldDistance(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

function playerCenter(entity) {
  return {
    x: entity.x + player.w * 0.5,
    y: entity.y + player.h * 0.5,
  };
}

function triggerPunchAnimation(id) {
  if (String(id) === String(networkState.playerId)) {
    player.punchUntil = currentNow + PUNCH_ANIM_MS;
    return;
  }

  const remote = remotePlayers.get(id);
  if (!remote) return;
  remote.punchUntil = currentNow + PUNCH_ANIM_MS;
  remotePlayers.set(id, remote);
}

function applyKnockback(targetId, impulseX, impulseY, nudgeX = 0, nudgeY = 0) {
  if (String(targetId) === String(networkState.playerId)) {
    player.vx += impulseX;
    player.vy = Math.min(player.vy, impulseY);
    queueSmoothNudge(nudgeX, nudgeY);
    player.knockbackUntil = Math.max(player.knockbackUntil, currentNow + KNOCKBACK_RECOVERY_MS);
    player.onGround = false;
    resolvePlayerOverlap();
    return;
  }

  const remote = remotePlayers.get(targetId);
  if (!remote) return;
  remote.x += nudgeX + impulseX * 0.03;
  remote.y += nudgeY + impulseY * 0.02;
  remotePlayers.set(targetId, remote);
}

function findPunchTarget() {
  const worldMouseX = mouseX + camera.x;
  const worldMouseY = mouseY + camera.y;
  const me = playerCenter(player);
  let picked = null;
  let bestDist = Infinity;

  remotePlayers.forEach((p) => {
    const inside =
      worldMouseX >= p.x &&
      worldMouseX <= p.x + player.w &&
      worldMouseY >= p.y &&
      worldMouseY <= p.y + player.h;

    if (!inside) return;

    const other = playerCenter(p);
    const dist = worldDistance(me.x, me.y, other.x, other.y) / TILE;
    if (dist > PUNCH_RANGE_TILES) return;
    if (dist < bestDist) {
      bestDist = dist;
      picked = p;
    }
  });

  return picked;
}

function tryPunchPlayer(now) {
  if (!ONLINE_MODE || !networkState.connected) return;
  if (now < player.nextPunchAt) return;

  const target = findPunchTarget();
  if (!target) return;

  player.nextPunchAt = now + PUNCH_COOLDOWN_MS;
  player.punchUntil = now + PUNCH_ANIM_MS;
  suppressBreakUntil = now + PUNCH_ANIM_MS;
  sendSocket({ type: "punch_player", targetId: target.id });
}

function handleDigitCombo(digit, now) {
  if (now > digitComboExpiresAt) {
    digitCombo = "";
  }

  digitCombo += String(digit);
  if (digitCombo.length > 3) {
    digitCombo = digitCombo.slice(-3);
  }

  digitComboExpiresAt = now + DIGIT_COMBO_TIMEOUT_MS;

  if (digitCombo === "123") {
    player.health = Math.min(player.maxHealth, player.health + 10);
    player.nextPunchAt = Math.min(player.nextPunchAt, now);
    player.punchUntil = now + PUNCH_ANIM_MS;
    setAuthMessage("123 combo activated: +10 HP");
    digitCombo = "";
  }
}

function sendSocket(event) {
  if (!networkState.connected || !networkState.socket) return;
  if (networkState.socket.readyState !== WebSocket.OPEN) return;
  networkState.socket.send(JSON.stringify(event));
}

function sendChatMessage() {
  if (!chatInput) return;
  const raw = chatInput.value ?? "";
  const text = raw.trim().slice(0, 100);
  if (!text) return;
  if (!ONLINE_MODE || !networkState.connected) {
    setAuthMessage("Chat requires online mode.");
    return;
  }

  chatInput.value = "";
  const playerId = networkState.playerId || networkState.userId;
  if (playerId) {
    addChatBubble(playerId, text);
  }
  sendSocket({ type: "chat", text });

  // Always close the chat panel after sending
  chatBar?.classList.add("hidden");
  chatInput?.blur();
  chatRecentlyClosed = true;
  setTimeout(() => { chatRecentlyClosed = false; }, 80);
}

function tryBreak(dt) {
  if (currentNow < suppressBreakUntil) {
    breakState.progress = 0;
    return;
  }

  if (!leftDown) {
    breakState.progress = 0;
    breakState.targetX = -1;
    breakState.targetY = -1;
    return;
  }

  // Only allow breaking if punch mode is selected (-1 means punch mode)
  if (selectedSlot !== -1) {
    breakState.progress = 0;
    breakState.targetX = -1;
    breakState.targetY = -1;
    return;
  }

  // Check world ownership - only owner can break
  const isOwner = worldOwner && String(networkState.userId) === String(worldOwner.userId);
  if (worldOwner && !isOwner) {
    breakState.progress = 0;
    breakState.targetX = -1;
    breakState.targetY = -1;
    console.warn("Break denied - not owner", { worldOwnerId: worldOwner.userId, myUserId: networkState.userId });
    setAuthMessage("Only the world owner can break blocks here!");
    return;
  }

  const { tx, ty } = screenToWorldTile(mouseX, mouseY);
  if (!inBounds(tx, ty) || !canReach(tx, ty)) {
    breakState.progress = 0;
    return;
  }

  const tile = getTile(tx, ty);
  const plantKey = `${tx}:${ty}`;
  const plant = growingPlants.get(plantKey);
  
  // Can't break air/door tiles unless there's a growing plant
  if ((tile === 0 || tile === 7) && !plant) {
    breakState.progress = 0;
    return;
  }

  if (breakState.targetX !== tx || breakState.targetY !== ty) {
    breakState.targetX = tx;
    breakState.targetY = ty;
    breakState.progress = 0;
  }

  breakState.progress += dt;
  
  // Determine hardness - use plant hardness if it exists, otherwise use tile hardness
  let hardness;
  if (plant) {
    // Growing trees take 4s; fully grown trees break instantly.
    hardness = plant.fullGrown ? 0 : TREE_BREAK_SECONDS;
  } else {
    hardness = tileDefs[tile].hardness;
  }
  
  if (breakState.progress >= hardness) {
    setTile(tx, ty, 0);
    
    // Check if breaking a tree (growing or mature)
    if (plant) {
      if (plant.fullGrown) {
        // Harvest mature tree - spawn blocks
        const dropX = tx * TILE + TILE / 2;
        const dropY = ty * TILE + TILE / 2;
        const sourceBlock = plant.sourceBlock;
        const dropCount = plant.dropCount;

        // Keep drops anchored to the broken tile and stack same items.
        spawnDropStack(sourceBlock, dropX, dropY, dropCount);
        
        // Low chance to also drop 1 seed
        if (Math.random() < 0.25) {
          const seedItem = 8 + sourceBlock;
          spawnDropStack(seedItem, dropX, dropY, 1);
        }
      } else {
        // Break growing tree - low chance for seeds or nothing
        const dropX = tx * TILE + TILE / 2;
        const dropY = ty * TILE + TILE / 2;
        
        // 30% chance to drop a seed, 70% chance for nothing
        if (Math.random() < 0.3) {
          const seedItem = 8 + plant.sourceBlock; // Convert block to seed
          spawnDropStack(seedItem, dropX, dropY, 1);
        }
      }
      
      growingPlants.delete(plantKey);
      // Save to localStorage for offline mode
      saveGrowingPlants();
    } else {
      // Normal block breaking
      const dropItem = calculateBlockDrop(tile);
      
      // Special handling for land_lock - goes directly to inventory
      if (tile === 15) {
        if (!inventory[15]) inventory[15] = 0;
        inventory[15]++;
        saveInventoryItems();
        setAuthMessage("+1 Land Lock");
      } else if (dropItem !== null) {
        // Create drop if something drops
        const dropX = tx * TILE + TILE / 2;
        const dropY = ty * TILE + TILE / 2;
        spawnDropStack(dropItem, dropX, dropY, 1);
      }
    }
    
    if (plant) {
      sendSocket({ type: "destroy_plant", x: tx, y: ty });
    } else {
      sendSocket({ type: "block_update", x: tx, y: ty, tile: 0 });
    }
    breakState.progress = 0;
  }
}

function calculateBlockDrop(tileType) {
  const def = tileDefs[tileType];
  if (!def) return null;
  if (tileType === LAVA_TILE) {
    const roll = Math.random();
    if (roll < 0.3) return null; // nothing
    if (roll < 0.65) return 17;  // lava seed
    return LAVA_TILE;           // lava block
  }
  const rarity = def.rarity || 1;
  const roll = Math.random();

  // Base distribution: 25% seed, 35% block, 40% nothing.
  // Reduce seed chance for higher rarity (rarity>1); shifted seed loss goes to block chance.
  const baseSeed = 0.25;
  const baseBlock = 0.35;
  const baseNothing = 0.40;
  const rarityPenalty = Math.max(0, rarity - 1) * 0.05; // -5% per rarity step above 1
  const seedChance = Math.max(0.1, baseSeed - rarityPenalty);
  const blockChance = baseBlock + (baseSeed - seedChance); // reclaim reduced seed chance

  if (roll < baseNothing) return null;
  if (roll < baseNothing + seedChance) return tileType + 8; // seed drop
  if (roll < baseNothing + seedChance + blockChance) return tileType; // block drop
  return null; // Fallback (should not hit because totals sum to 1)
}

function tryPlace() {
  if (!leftDown) return;

  const isPunchSelected = selectedSlot === -1; // -1 means punch button selected
  if (isPunchSelected) return; // Don't place if punch is selected

  const { tx, ty } = screenToWorldTile(mouseX, mouseY);
  if (!inBounds(tx, ty) || !canReach(tx, ty)) return;
  if (getTile(tx, ty) !== 0) return;

  const plantKey = `${tx}:${ty}`;
  const existingPlant = growingPlants.get(plantKey);

  const selectedItem = hotbarOrder[selectedSlot];
  if (!inventory[selectedItem] || inventory[selectedItem] < 1) return;

  const placingSeed = isSeedItem(selectedItem);
  let seedPlacement = null;
  if (placingSeed) {
    const seedSourceBlock = getSeedSourceBlock(selectedItem);
    if (!seedSourceBlock) return;

    let finalSourceBlock = seedSourceBlock;
    let isComboPlant = false;
    if (existingPlant) {
      const comboResult = getSeedCombinationResult(existingPlant.sourceBlock, seedSourceBlock);
      if (!comboResult) {
        setAuthMessage("These seeds cannot combine in the same block!");
        return;
      }
      finalSourceBlock = comboResult;
      isComboPlant = true;
    }

    const finalSeedItem = getSeedItemForSourceBlock(finalSourceBlock);
    const growingTile = getGrowingTileForSourceBlock(finalSourceBlock);
    if (finalSeedItem === null || growingTile === null) return;

    const rarity = getItemRarity(finalSeedItem);
    const growthTime = getGrowthTimeSeconds(rarity);
    const baseDrops = 2 + rarity;
    const dropCount = baseDrops + (Math.random() < 0.5 ? 1 : 0);
    const plantedAt = Date.now();
    seedPlacement = {
      growthTime,
      dropCount,
      plantedAt,
      sourceBlock: finalSourceBlock,
      isComboPlant,
    };

    const supportY = ty + 1;
    if (!inBounds(tx, supportY) || !isSolid(getTile(tx, supportY))) {
      setAuthMessage("Seeds must be planted above a solid block!");
      return;
    }
  } else if (existingPlant) {
    setAuthMessage("A seed is already growing in this block!");
    return;
  }

  const tileX = tx * TILE;
  const tileY = ty * TILE;
  if (
    player.x < tileX + TILE &&
    player.x + player.w > tileX &&
    player.y < tileY + TILE &&
    player.y + player.h > tileY
  ) {
    return;
  }

  const isLandLock = selectedItem === 15; // Land lock block ID
  const isOwner = worldOwner && String(networkState.userId) === String(worldOwner.userId);

  // Check world ownership first - non-owners can't build at all
  if (worldOwner && !isOwner) {
    setAuthMessage("Only the world owner can build in this world!");
    return;
  }

  // Owner can build anywhere. Non-owners already rejected above.
  // Check if position is locked by another player (only matters for non-owners, but owner can build anywhere)
  if (!isOwner && isPositionLocked(tx, ty)) {
    setAuthMessage("This area is locked by another player!");
    return;
  }

  inventory[selectedItem]--;
  saveInventoryItems();
  
  // Handle land lock placement
  if (isLandLock) {
    setTile(tx, ty, 15); // Land lock tile ID
    suppressBreakUntil = currentNow + 300;
    
    // Set world owner if not already set
    if (!worldOwner) {
      worldOwner = {
        userId: String(networkState.userId),
        username: networkState.username
      };
      console.log("Player claimed world - owner set to", { userId: networkState.userId, username: networkState.username });
      updateWorldOwnerDisplay();
      setAuthMessage(`${networkState.username} claimed the world!`);
    } else {
      console.log("World already has owner:", { ownerId: worldOwner.userId, currentUserId: networkState.userId });
    }
    
    sendSocket({ 
      type: "block_update", 
      x: tx, 
      y: ty, 
      tile: 15,
      owner: worldOwner 
    });
    return;
  }
  
  // Handle seed planting vs block placement
  if (placingSeed) {
    // Plant seed - keep tile empty (0) and track in growingPlants map
    if (!seedPlacement) return;
    growingPlants.set(plantKey, { 
      progress: 0, 
      totalTime: seedPlacement.growthTime,
      dropCount: seedPlacement.dropCount,
      sourceBlock: seedPlacement.sourceBlock,
      fullGrown: false,
      plantedAt: seedPlacement.plantedAt
    });
    setTile(tx, ty, 0);
    // Suppress breaking for 500ms after planting to prevent instant destruction
    suppressBreakUntil = currentNow + 500;
    // Send plant info to server
    sendSocket({ 
      type: "plant_seed", 
      x: tx, 
      y: ty, 
      sourceBlock: seedPlacement.sourceBlock,
      dropCount: seedPlacement.dropCount,
      totalTime: seedPlacement.growthTime,
      plantedAt: seedPlacement.plantedAt
    });
    if (seedPlacement.isComboPlant) {
      const comboName = tileDefs[seedPlacement.sourceBlock]?.name || "new";
      setAuthMessage(`Seed combo successful! ${comboName} tree is now growing.`);
    }
    // Save to localStorage for offline mode
    saveGrowingPlants();
  } else {
    // Place block normally
    setTile(tx, ty, selectedItem);
    // Suppress breaking for 300ms after placing
    suppressBreakUntil = currentNow + 300;
    sendSocket({ type: "block_update", x: tx, y: ty, tile: selectedItem });
  }
}

function performDrop(requestedAmount) {
  if (selectedInventoryTile === null) {
    setAuthMessage("Select an item to drop");
    return;
  }
  const available = inventory[selectedInventoryTile] || 0;
  const parsed = Number.isFinite(requestedAmount) ? Math.floor(requestedAmount) : 0;
  const amount = Math.max(1, Math.min(available, parsed));
  if (available <= 0 || amount <= 0) {
    setAuthMessage("No items to drop");
    return;
  }

  const facing = player.facing || 1;
  const baseX = player.x + player.w * 0.5 + facing * MANUAL_DROP_FORWARD_OFFSET;
  const baseY = player.y + player.h * 0.7;

  spawnDropStack(selectedInventoryTile, baseX, baseY, amount, { pickupDelayMs: MANUAL_DROP_PICKUP_LOCK_MS });

  inventory[selectedInventoryTile] = available - amount;
  saveInventoryItems();
  updateHUD();
  const name = (itemDefs[selectedInventoryTile] || tileDefs[selectedInventoryTile] || {}).name || "Item";
  setAuthMessage(`Dropped ${amount} ${name}`);
}

function updateCamera() {
  const targetX = player.x + player.w * 0.5 - canvas.width * 0.5;
  const targetY = player.y + player.h * 0.5 - canvas.height * 0.5;

  camera.x += (targetX - camera.x) * camera.smooth;
  camera.y += (targetY - camera.y) * camera.smooth;

  camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH * TILE - canvas.width));
  camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * TILE - canvas.height));
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#69b9ff");
  sky.addColorStop(0.6, "#90d4ff");
  sky.addColorStop(1, "#c7ecff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!settingsState.showClouds) return;

  ctx.fillStyle = "rgba(255,255,255,0.16)";
  for (let i = 0; i < 16; i += 1) {
    const x = ((i * 380 - camera.x * 0.3) % (canvas.width + 300)) - 150;
    const y = 80 + (i % 5) * 45;
    ctx.beginPath();
    ctx.ellipse(x, y, 80, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWorld() {
  const startX = Math.floor(camera.x / TILE);
  const endX = Math.ceil((camera.x + canvas.width) / TILE);
  const startY = Math.floor(camera.y / TILE);
  const endY = Math.ceil((camera.y + canvas.height) / TILE);

  for (let y = startY; y <= endY; y += 1) {
    for (let x = startX; x <= endX; x += 1) {
      const tile = getTile(x, y);
      if (tile === 0) continue;

      const def = tileDefs[tile];
      if (!def) continue;
      const drawX = x * TILE - camera.x;
      const drawY = y * TILE - camera.y;
      drawBlockTexture(tile, def, drawX, drawY);
    }
  }
}

function drawHealthBar(worldX, worldY, health, maxHealth, label, isOwner = false) {
  const px = worldX - camera.x;
  const py = worldY - camera.y;
  const barW = 44;
  const ratio = Math.max(0, Math.min(1, health / Math.max(1, maxHealth)));

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(px - 10, py - 16, barW, 6);
  ctx.fillStyle = ratio > 0.35 ? "#4ade80" : "#ef4444";
  ctx.fillRect(px - 10, py - 16, Math.floor(barW * ratio), 6);

  if (isOwner) {
    ctx.font = "14px Trebuchet MS";
    ctx.fillStyle = "#00ff00";
  } else {
    ctx.font = "10px Trebuchet MS";
    ctx.fillStyle = "#ffffff";
  }
  ctx.textAlign = "center";
  ctx.fillText(label, px + 12, py - 19);
}

function drawPlayerSprite(worldX, worldY, direction, isMoving) {
  const px = worldX - camera.x;
  const py = worldY - camera.y;
  const normalizedDirection = PLAYER_SPRITES[direction] ? direction : "right";
  const sheet = getTexture(PLAYER_SPRITES[normalizedDirection]);
  if (!(sheet && sheet.complete && sheet.naturalWidth >= PLAYER_SPRITE_FRAME_SIZE && sheet.naturalHeight >= PLAYER_SPRITE_FRAME_SIZE)) {
    return false;
  }

  const frame = isMoving
    ? Math.floor((currentNow / 1000) * PLAYER_SPRITE_FPS) % PLAYER_SPRITE_FRAMES
    : 0;
  const sx = frame * PLAYER_SPRITE_FRAME_SIZE;
  const drawW = TILE;
  const drawH = TILE;
  const drawX = px + Math.floor((player.w - drawW) * 0.5);
  const drawY = py + (player.h - drawH);

  ctx.drawImage(
    sheet,
    sx,
    0,
    PLAYER_SPRITE_FRAME_SIZE,
    PLAYER_SPRITE_FRAME_SIZE,
    drawX,
    drawY,
    drawW,
    drawH
  );
  return true;
}

function getRemoteAnimationState(remotePlayer) {
  const prevX = Number(remotePlayer._prevAnimX ?? remotePlayer.x);
  const prevY = Number(remotePlayer._prevAnimY ?? remotePlayer.y);
  const dx = Number(remotePlayer.x) - prevX;
  const dy = Number(remotePlayer.y) - prevY;
  remotePlayer._prevAnimX = remotePlayer.x;
  remotePlayer._prevAnimY = remotePlayer.y;

  let direction = remotePlayer.animDirection || (remotePlayer.facing < 0 ? "left" : "right");
  if (Math.abs(dx) > 0.15) {
    direction = dx < 0 ? "left" : "right";
  } else if (Math.abs(dy) > 0.15) {
    direction = dy < 0 ? "up" : "down";
  }

  const isMoving = Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15;
  remotePlayer.animDirection = direction;
  return { direction, isMoving };
}

function drawPlayerBody(worldX, worldY, facing, bodyColor, attackStrength = 0, direction = null, isMoving = false) {
  const spriteDirection = direction || (facing < 0 ? "left" : "right");
  if (drawPlayerSprite(worldX, worldY, spriteDirection, isMoving)) {
    return;
  }

  // Avoid flashing the legacy body while sprite sheets are still loading.
  if (!playerSpritePreloadFinished) {
    return;
  }

  const px = worldX - camera.x;
  const py = worldY - camera.y;
  const shoulderX = px + (facing > 0 ? player.w - 6 : 6);
  const shoulderY = py + Math.floor(player.h * 0.62);
  const headSize = Math.max(12, Math.floor(player.h * 0.42));
  const headX = px + 5;
  const headY = py + 4;

  ctx.fillStyle = bodyColor;
  ctx.fillRect(px, py, player.w, player.h);

  const swing = Math.sin(Math.PI * attackStrength);
  const baseAngle = facing > 0 ? 0.15 : Math.PI - 0.15;
  const angle = baseAngle + (facing > 0 ? 1 : -1) * swing * 0.9;
  ctx.save();
  ctx.translate(shoulderX, shoulderY);
  ctx.rotate(angle);
  ctx.fillStyle = "#ffd7ae";
  ctx.fillRect(0, -2, 13, 4);
  ctx.restore();

  ctx.fillStyle = "#ffd7ae";
  ctx.fillRect(headX, headY, 14, headSize);
  ctx.fillStyle = "#0f1f46";
  const eyeOffset = facing > 0 ? 14 : 8;
  const eyeY = headY + Math.max(3, Math.floor(headSize * 0.35));
  ctx.fillRect(px + eyeOffset, eyeY, 3, 3);
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapChatText(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);

    if (ctx.measureText(word).width <= maxWidth) {
      current = word;
      continue;
    }

    // Break long word
    let segment = "";
    for (const ch of word) {
      const next = segment + ch;
      if (ctx.measureText(next).width > maxWidth && segment) {
        lines.push(segment);
        segment = ch;
      } else {
        segment = next;
      }
    }
    current = segment;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function drawChatBubble(worldX, worldY, text) {
  if (!text) return;

  ctx.save();
  ctx.font = "12px Trebuchet MS";
  const maxWidth = 200;
  const lines = wrapChatText(text, maxWidth - 16);
  const lineHeight = 14;
  const measured = lines.map((line) => ctx.measureText(line).width);
  const widest = measured.length ? Math.max(...measured) : 0;
  const bubbleWidth = Math.min(maxWidth, Math.max(40, widest + 16));
  const bubbleHeight = lines.length * lineHeight + 12;

  const px = worldX - camera.x;
  const py = worldY - camera.y;
  const anchorX = px + player.w * 0.5;
  const anchorY = py - 8;
  const bubbleX = anchorX - bubbleWidth / 2;
  const bubbleY = anchorY - bubbleHeight - 12;

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  drawRoundedRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(anchorX - 6, bubbleY + bubbleHeight);
  ctx.lineTo(anchorX + 6, bubbleY + bubbleHeight);
  ctx.lineTo(anchorX, bubbleY + bubbleHeight + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, idx) => {
    const lineY = bubbleY + 6 + idx * lineHeight + lineHeight * 0.5;
    ctx.fillText(line, anchorX, lineY);
  });

  ctx.restore();
}

function drawRemotePlayers() {
  remotePlayers.forEach((p) => {
    const attackStrength = Math.max(0, (p.punchUntil || 0) - currentNow) / PUNCH_ANIM_MS;
    const anim = getRemoteAnimationState(p);
    drawPlayerBody(p.x, p.y, p.facing, "#73318e", attackStrength, anim.direction, anim.isMoving);
    const ownerId = worldOwner ? String(worldOwner.userId) : null;
    const playerOwnerId = p ? String(p.userId ?? p.id) : null;
    const isOwner = ownerId && playerOwnerId === ownerId;
    drawHealthBar(p.x, p.y, p.health ?? MAX_HEALTH, p.maxHealth ?? MAX_HEALTH, p.username, isOwner);

    const bubbleKey = p ? String(p.id) : null;
    const bubble = bubbleKey ? chatBubbles.get(bubbleKey) : null;
    if (bubble && bubble.expiresAt > currentNow) {
      drawChatBubble(p.x, p.y, bubble.text);
    } else if (bubble && bubble.expiresAt <= currentNow && bubbleKey) {
      chatBubbles.delete(bubbleKey);
    }
  });
}

function drawGrowingPlants() {
  const playerTx = Math.floor((player.x + player.w * 0.5) / TILE);
  const playerTy = Math.floor((player.y + player.h * 0.5) / TILE);

  for (const [plantKey, plant] of growingPlants.entries()) {
    const [x, y] = plantKey.split(":").map(Number);
    const drawX = x * TILE - camera.x;
    const drawY = y * TILE - camera.y;
    const showPlantText = playerTx === x && playerTy === y;
    
    const progress = Math.max(0, Math.min(1, plant.progress / plant.totalTime));
    const remainingTime = Math.max(0, plant.totalTime - plant.progress);
    const tile = getTile(x, y);
    const tileDef = tileDefs[tile];
    
    if (tileDef && plant.sourceBlock) {
      const sourceTileDef = tileDefs[plant.sourceBlock];
      const crownColor = sourceTileDef?.color || "#22c55e";
      const centerX = drawX + TILE / 2;
      const centerY = drawY + TILE / 2;
      
      // Draw single-block tree
      const trunkHeight = 6;
      const crownRadius = 6 + progress * 4;
      
      // Draw trunk
      ctx.fillStyle = "#704214";
      ctx.fillRect(centerX - 2, centerY + 2, 4, trunkHeight);
      
      // Draw crown (single circle that grows)
      ctx.fillStyle = crownColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 2, crownRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Add highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 4, crownRadius / 3, 0, Math.PI * 2);
      ctx.fill();
      
      if (showPlantText) {
        const sourceName = sourceTileDef?.name || "Tree";
        const treeName = sourceName.endsWith(" Block")
          ? `${sourceName.slice(0, -6)} Tree`
          : `${sourceName} Tree`;

        // Draw timer above the tree
        const timerY = drawY - 8;
        let timerText = "";
        if (plant.fullGrown) {
          timerText = "✓";
          ctx.fillStyle = "#fbbf24";
        } else {
          const seconds = Math.ceil(remainingTime);
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          timerText = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
          ctx.fillStyle = "#60a5fa";
        }

        // Show tree name while still growing.
        if (!plant.fullGrown) {
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 9px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(treeName, centerX, timerY - 11);
        }

        // Draw timer text (no background)
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(timerText, centerX, timerY);
      }
      
      // Draw drop count indicator when fully grown
      if (plant.fullGrown) {
        ctx.fillStyle = "#fbbf24";
        ctx.font = "bold 10px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(plant.dropCount, centerX, drawY + TILE + 2);
      }
    }
  }
}

function drawSelection() {
  const { tx, ty } = screenToWorldTile(mouseX, mouseY);
  if (!inBounds(tx, ty) || !canReach(tx, ty)) return;

  const drawX = tx * TILE - camera.x;
  const drawY = ty * TILE - camera.y;

  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 2;
  ctx.strokeRect(drawX + 1, drawY + 1, TILE - 2, TILE - 2);

  if (breakState.targetX === tx && breakState.targetY === ty) {
    const tile = getTile(tx, ty);
    const plantKey = `${tx}:${ty}`;
    const plant = growingPlants.get(plantKey);
    
    let hardness = 1;
    if (plant) {
      hardness = plant.fullGrown ? 0 : TREE_BREAK_SECONDS;
    } else {
      hardness = tileDefs[tile]?.hardness ?? 1;
    }
    
    const ratio = hardness === 0 ? 1 : Math.min(1, breakState.progress / hardness);
    ctx.fillStyle = "rgba(239, 68, 68, 0.65)";
    ctx.fillRect(drawX, drawY + TILE - 4, TILE * ratio, 4);
  }
}

function drawReachRing() {
  const px = player.x + player.w * 0.5 - camera.x;
  const py = player.y + player.h * 0.5 - camera.y;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.beginPath();
  ctx.arc(px, py, player.reach * TILE, 0, Math.PI * 2);
  ctx.stroke();
}

function updateHUD() {
  const x = Math.floor((player.x + player.w * 0.5) / TILE);
  const y = Math.floor((player.y + player.h * 0.5) / TILE);
  const remoteCount = remotePlayers.size;
  const modeLabel = ONLINE_MODE ? (networkState.connected ? "Online" : "Online (disconnected)") : "Singleplayer";
  
  const tileUnder = getTile(x, Math.floor((player.y + player.h) / TILE));
  const hint = tileUnder === 7 ? " [Press E to exit]" : "";
  
  // Show punch or selected item
  let selectedName, selectedCount;
  if (selectedSlot === -1) {
    selectedName = "Punch";
    selectedCount = "∞";
  } else {
    const selectedTile = hotbarOrder[selectedSlot];
    const selectedItemDef = itemDefs[selectedTile] || tileDefs[selectedTile];
    selectedName = selectedItemDef ? selectedItemDef.name : "Unknown";
    selectedCount = inventory[selectedTile] || 0;
  }
  
  statusEl.textContent = `World:${WORLD_NAME} | X:${x} Y:${y} | HP:${Math.floor(player.health)}/${player.maxHealth} | Selected:${selectedName} x${selectedCount} | ${modeLabel} | Players:${remoteCount + 1}${hint}`;

  // Update gem counter
  if (gemCountEl) {
    const gemCount = inventory[8] || 0;
    gemCountEl.textContent = gemCount;
  }

  // Update punch button styling
  if (btnPunch) {
    if (selectedSlot === -1) {
      btnPunch.classList.add("selected");
    } else {
      btnPunch.classList.remove("selected");
    }
  }

  // Render quick slots (5 slots from hotbar)
  renderQuickSlots();

  // Render full inventory for modal
  renderFullInventory();
}

function renderQuickSlots() {
  if (!quickSlotsEl) return;
  quickSlotsEl.innerHTML = "";

  // Show first 5 slots
  for (let i = 0; i < 5; i++) {
    const tile = hotbarOrder[i];
    const count = inventory[tile] || 0;

    const item = itemDefs[tile];
    const slot = document.createElement("div");
    slot.className = `quick-slot ${i === selectedSlot ? "selected" : ""}`;
    slot.setAttribute("data-slot-index", String(i));
    slot.setAttribute("data-tile", String(tile));

    if (count > 0) {
      const icon = document.createElement("img");
      icon.className = "slot-icon";
      icon.src = getVersionedAssetPath(item.icon);
      icon.alt = item.name;
      icon.loading = "lazy";

      const key = document.createElement("span");
      key.className = "quick-slot-key";
      key.textContent = String(i + 1);

      const label = document.createElement("span");
      label.textContent = `x${count}`;
      label.style.fontSize = "0.6rem";

      slot.appendChild(key);
      slot.appendChild(icon);
      slot.appendChild(label);
    }

    quickSlotsEl.appendChild(slot);
  }
}

function renderFullInventory() {
  if (!inventoryEl) return;
  inventoryEl.innerHTML = "";

  // Render hotbar items
  hotbarOrder.forEach((tile, idx) => {
    const count = inventory[tile] || 0;
    if (count === 0) return;

    const item = itemDefs[tile];
    const slot = document.createElement("div");
    const selectedClass = selectedInventoryTile === tile ? "selected-drop" : "";
    slot.className = `slot ${idx === selectedSlot ? "active" : ""} ${selectedClass}`;
    slot.setAttribute("data-slot-index", String(idx));
    slot.setAttribute("data-tile", String(tile));
    slot.style.borderBottom = `4px solid ${item.color}`;
    slot.style.cursor = "pointer";

    const key = document.createElement("span");
    key.className = "slot-key";
    key.textContent = `${idx + 1}`;

    const icon = document.createElement("img");
    icon.className = "slot-icon";
    icon.src = getVersionedAssetPath(item.icon);
    icon.alt = item.name;
    icon.loading = "lazy";

    const label = document.createElement("span");
    label.className = "slot-label";
    label.textContent = `${item.name} x${count}`;

    const rarity = document.createElement("span");
    rarity.className = "slot-rarity";
    rarity.textContent = `★ ${item.rarity || 0}`;

    slot.appendChild(key);
    slot.appendChild(icon);
    slot.appendChild(label);
    slot.appendChild(rarity);

    inventoryEl.appendChild(slot);
  });

  // Display loot items (gems and seeds) that aren't already in hotbar
  const lootItems = [8, 9, 10, 11, 12, 13, 14];
  lootItems.forEach((itemId) => {
    if (hotbarOrder.includes(itemId)) return; // Skip items already in hotbar
    const count = inventory[itemId] || 0;
    if (count === 0) return;

    const item = itemDefs[itemId];
    if (!item) return;

    const slot = document.createElement("div");
    const selectedClass = selectedInventoryTile === itemId ? "selected-drop" : "";
    slot.className = `slot loot ${selectedClass}`;
    slot.setAttribute("data-tile", String(itemId));
    slot.style.borderBottom = `4px solid ${item.color}`;
    slot.style.cursor = "default";
    slot.style.opacity = "0.8";

    const icon = document.createElement("img");
    icon.className = "slot-icon";
    icon.src = getVersionedAssetPath(item.icon);
    icon.alt = item.name;
    icon.loading = "lazy";

    const label = document.createElement("span");
    label.className = "slot-label";
    label.textContent = `${item.name} x${count}`;

    const rarity = document.createElement("span");
    rarity.className = "slot-rarity";
    rarity.textContent = `★ ${item.rarity || 0}`;

    slot.appendChild(icon);
    slot.appendChild(label);
    slot.appendChild(rarity);

    inventoryEl.appendChild(slot);
  });
}

function connectSocket(token) {
  if (!ONLINE_MODE) return;
  if (networkState.socket) networkState.socket.close();
  manualDisconnect = false;
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
  const wsUrl = `${wsProtocol}://${window.location.host}/ws?token=${encodeURIComponent(token)}&world=${encodeURIComponent(WORLD_NAME)}`;
  const socket = new WebSocket(wsUrl);
  networkState.socket = socket;

  socket.addEventListener("open", () => {
    networkState.connected = true;
    setOnlineBadge(true, "Online");
    setAuthMessage(`Connected as ${networkState.username || "player"}`);
    reconnectAttempts = 0;
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  });

  socket.addEventListener("message", async (event) => {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch {
      return;
    }

    if (msg.type === "init") {
      if (Array.isArray(msg.world) && msg.world.length === world.length) {
        world.set(msg.world);
      }
      if (msg.player) {
        player.x = msg.player.x;
        player.y = msg.player.y;
        player.health = msg.player.health ?? MAX_HEALTH;
        player.maxHealth = msg.player.maxHealth ?? MAX_HEALTH;
      }
      networkState.playerId = String(msg.id);
      networkState.userId = msg.userId != null ? String(msg.userId) : String(msg.id);
      networkState.username = msg.username;
      try {
        localStorage.setItem(LAST_USERNAME_KEY, msg.username);
      } catch {}
      
      // Set world owner if it exists
      if (msg.worldOwner && msg.worldOwner.userId) {
        worldOwner = {
          userId: String(msg.worldOwner.userId),
          username: msg.worldOwner.username
        };
        console.log("World owner loaded from server on init:", { ownerId: msg.worldOwner.userId, username: msg.worldOwner.username, myUserId: networkState.userId });
        updateWorldOwnerDisplay();
      }
      
      await preloadPlayerSprites();
      unlockGameplay();
      if (msg.inventory) {
        applyInventoryFromServer(msg.inventory);
      } else {
        loadInventoryItems();
      }
      // Load drops from server so all players see existing drops
      drops.clear();
      if (Array.isArray(msg.drops)) {
        msg.drops.forEach((d) => {
          const normalizedDrop = normalizeDropRecord(d);
          if (normalizedDrop) {
            drops.set(normalizedDrop.id, normalizedDrop);
          }
        });
      }
      remotePlayers.clear();
      if (Array.isArray(msg.players)) {
        msg.players.forEach((p) => {
          remotePlayers.set(p.id, {
            ...p,
            userId: p.userId != null ? String(p.userId) : p.userId,
            health: p.health ?? MAX_HEALTH,
            maxHealth: p.maxHealth ?? MAX_HEALTH,
            punchUntil: 0,
          });
        });
      }
      
      // Load growing plants from server
      if (Array.isArray(msg.plants)) {
        console.log("Loading", msg.plants.length, "plants from server");
        growingPlants.clear();
        msg.plants.forEach(p => {
          const plantKey = `${p.x}:${p.y}`;
          growingPlants.set(plantKey, {
            progress: 0,
            totalTime: p.totalTime,
            dropCount: p.dropCount,
            sourceBlock: p.sourceBlock,
            fullGrown: p.fullGrown || false,
            plantedAt: p.plantedAt
          });
        });
      } else {
        // Server didn't provide plants - load from localStorage as fallback
        console.log("Server didn't send plants, loading from localStorage fallback");
        growingPlants.clear();
        loadGrowingPlants();
      }

      chatHistory.length = 0;
      chatHistoryIds.clear();
      if (Array.isArray(msg.chats)) {
        msg.chats.forEach((chat) => {
          addChatHistoryEntry({
            chatId: chat.chatId ?? chat.id,
            username: chat.username || "Player",
            text: chat.text || chat.message,
            createdAt: chat.createdAt,
          }, { skipRender: true });
        });
      }
      renderChatHistory();

      // Friends init
      friendsState.pairs = Array.isArray(msg.friends) ? msg.friends.map((p) => ({
        pairId: p.pairId,
        friendUserId: String(p.friendUserId),
        friendUsername: p.friendUsername,
        status: p.status,
        requestedBy: p.requestedBy,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) : [];
      friendsState.messages.clear();
      if (Array.isArray(msg.friendMessages)) {
        msg.friendMessages.forEach((m) => {
          addFriendMessages(m.pairId, [{
            id: m.id,
            pairId: m.pairId,
            senderId: m.senderId,
            recipientId: m.recipientId,
            message: m.message,
            createdAt: m.createdAt,
          }]);
        });
      }
      renderFriendsList();
      renderFriendMessages();
      return;
    }

    if (msg.type === "player_join") {
      remotePlayers.set(msg.player.id, {
        ...msg.player,
        userId: msg.player.userId != null ? String(msg.player.userId) : msg.player.userId,
        health: msg.player.health ?? MAX_HEALTH,
        maxHealth: msg.player.maxHealth ?? MAX_HEALTH,
        punchUntil: 0,
      });
      return;
    }

    if (msg.type === "player_leave") {
      remotePlayers.delete(msg.id);
      if (msg.id != null) chatBubbles.delete(String(msg.id));
      return;
    }

    if (msg.type === "player_move") {
      if (String(msg.id) === String(networkState.playerId)) return;
      const current = remotePlayers.get(msg.id) || { id: msg.id, username: msg.username || "Player" };
      if (msg.userId != null && !current.userId) current.userId = String(msg.userId);
      current.x = msg.x;
      current.y = msg.y;
      current.facing = msg.facing;
      if (typeof msg.health === "number") current.health = msg.health;
      current.maxHealth = current.maxHealth || MAX_HEALTH;
      remotePlayers.set(msg.id, current);
      return;
    }

    if (msg.type === "health_update") {
      if (String(msg.id) === String(networkState.playerId)) {
        player.health = msg.health;
        player.maxHealth = msg.maxHealth || MAX_HEALTH;
      } else {
        const current = remotePlayers.get(msg.id);
        if (current) {
          current.health = msg.health;
          current.maxHealth = msg.maxHealth || MAX_HEALTH;
          remotePlayers.set(msg.id, current);
        }
      }
      return;
    }

    if (msg.type === "punch") {
      triggerPunchAnimation(msg.id);
      return;
    }

    if (msg.type === "knockback") {
      applyKnockback(
        msg.targetId,
        Number(msg.vx) || 0,
        Number(msg.vy) || 0,
        Number(msg.dx) || 0,
        Number(msg.dy) || 0
      );
      return;
    }

    if (msg.type === "respawn") {
      if (String(msg.id) === String(networkState.playerId)) {
        player.x = msg.x;
        player.y = msg.y;
        player.vx = 0;
        player.vy = 0;
        player.pendingNudgeX = 0;
        player.pendingNudgeY = 0;
        player.pendingNudgeTime = 0;
        player.knockbackUntil = 0;
        player.health = msg.health ?? MAX_HEALTH;
      } else {
        const current = remotePlayers.get(msg.id);
        if (current) {
          current.x = msg.x;
          current.y = msg.y;
          current.health = msg.health ?? MAX_HEALTH;
          remotePlayers.set(msg.id, current);
        }
      }
      return;
    }

    if (msg.type === "block_update") {
      setTile(msg.x, msg.y, msg.tile);
      resolvePlayerOverlap();
      return;
    }

    if (msg.type === "plant_seed") {
      // Receive plant data from server
      const plantKey = `${msg.x}:${msg.y}`;
      growingPlants.set(plantKey, {
        progress: 0,
        totalTime: msg.totalTime,
        dropCount: msg.dropCount,
        sourceBlock: msg.sourceBlock,
        fullGrown: false,
        plantedAt: msg.plantedAt
      });
      return;
    }

    if (msg.type === "destroy_plant") {
      const plantKey = `${msg.x}:${msg.y}`;
      growingPlants.delete(plantKey);
      // Ensure the tile is cleared client-side in case it was still present
      setTile(msg.x, msg.y, 0);
      return;
    }

    if (msg.type === "growing_plants") {
      // Load all growing plants from server on world load
      if (msg.plants && Array.isArray(msg.plants)) {
        growingPlants.clear();
        msg.plants.forEach(p => {
          const plantKey = `${p.x}:${p.y}`;
          growingPlants.set(plantKey, {
            progress: 0,
            totalTime: p.totalTime,
            dropCount: p.dropCount,
            sourceBlock: p.sourceBlock,
            fullGrown: p.fullGrown || false,
            plantedAt: p.plantedAt
          });
        });
      }
      return;
    }

    if (msg.type === "locked_areas") {
      // Load all locked areas from server on world load
      if (msg.locks && Array.isArray(msg.locks)) {
        lockedAreas.length = 0; // Clear array
        msg.locks.forEach(lock => {
          lockedAreas.push({
            userId: lock.userId != null ? String(lock.userId) : lock.userId,
            centerX: lock.centerX,
            centerY: lock.centerY,
            radius: lock.radius || 10
          });
        });
      }
      return;
    }

    if (msg.type === "drops") {
      // Full refresh of drops from server
      drops.clear();
      if (Array.isArray(msg.drops)) {
        msg.drops.forEach((d) => {
          const normalizedDrop = normalizeDropRecord(d);
          if (normalizedDrop) {
            drops.set(normalizedDrop.id, normalizedDrop);
          }
        });
      }
      return;
    }

    if (msg.type === "drop_spawn") {
      const d = msg.drop;
      if (d && d.id != null) {
        const normalizedDrop = normalizeDropRecord(d);
        if (normalizedDrop) {
          drops.set(normalizedDrop.id, normalizedDrop);
        }
      }
      return;
    }

    if (msg.type === "drop_collect") {
      if (msg.id != null) {
        drops.delete(msg.id);
      }
      return;
    }

    if (msg.type === "chat") {
      const text = (msg.text || "").toString().trim().slice(0, 100);
      const targetId = msg.id != null ? String(msg.id) : msg.userId != null ? String(msg.userId) : null;
      if (text && targetId) {
        addChatBubble(targetId, text);
      }
      addChatHistoryEntry({
        chatId: msg.chatId,
        username: msg.username || "Player",
        text,
        createdAt: msg.createdAt,
      });
      return;
    }

    if (msg.type === "friend_search_results") {
      friendsState.searchResults = Array.isArray(msg.results) ? msg.results : [];
      renderFriendSearchResults();
      return;
    }

    if (msg.type === "friend_pair_update") {
      const pair = msg.pair;
      if (!pair || pair.pairId == null) return;
      const existingIdx = friendsState.pairs.findIndex((p) => p.pairId === pair.pairId);
      const normalized = {
        pairId: pair.pairId,
        friendUserId: String(pair.friendUserId),
        friendUsername: pair.friendUsername,
        status: pair.status,
        requestedBy: pair.requestedBy,
        createdAt: pair.createdAt,
        updatedAt: pair.updatedAt,
      };
      if (existingIdx >= 0) {
        friendsState.pairs[existingIdx] = normalized;
      } else {
        friendsState.pairs.push(normalized);
      }
      renderFriendsList();
      renderFriendMessages();
      return;
    }

    if (msg.type === "friend_history") {
      if (!Array.isArray(msg.messages)) return;
      friendsState.messages.set(msg.pairId, []);
      addFriendMessages(msg.pairId, msg.messages.map(m => ({
        id: m.id,
        pairId: m.pairId,
        senderId: m.senderId,
        recipientId: m.recipientId,
        message: m.message,
        createdAt: m.createdAt,
      })));
      return;
    }

    if (msg.type === "friend_message") {
      if (msg.message && msg.pairId != null) {
        addFriendMessages(msg.pairId, [{
          id: msg.message.id,
          pairId: msg.message.pairId,
          senderId: msg.message.senderId,
          recipientId: msg.message.recipientId,
          message: msg.message.message,
          createdAt: msg.message.createdAt,
        }]);
      }
      return;
    }

    if (msg.type === "world_owner_set") {
      // World has been claimed by a player
      if (msg.userId) {
        worldOwner = {
          userId: String(msg.userId),
          username: msg.username
        };
        console.log("World owner broadcast received:", { ownerId: msg.userId, username: msg.username, myUserId: networkState.userId });
        updateWorldOwnerDisplay();
        if (String(msg.userId) === String(networkState.userId)) {
          setAuthMessage(`You claimed the world!`);
        } else {
          setAuthMessage(`${msg.username} claimed the world!`);
        }
      } else {
        worldOwner = null;
        updateWorldOwnerDisplay();
        setAuthMessage("World is now unclaimed.");
      }
      return;
    }

    if (msg.type === "error") {
      setAuthMessage(msg.message || msg.error || "Server error");
    }
  });

  socket.addEventListener("close", () => {
    networkState.connected = false;
    setOnlineBadge(false, "Offline");
    if (manualDisconnect || !ONLINE_MODE) return;
    if (gameplayUnlocked) {
      lockGameplay();
      setAuthMessage("Disconnected from server.");
      redirectToLogin("Disconnected. Please login again.");
    }
  });
}

async function resumeSession() {
  if (!ONLINE_MODE || !networkState.token) return false;
  try {
    const data = await apiRequest("/api/me", "GET", null, networkState.token);
    networkState.username = data.username;
    try {
      localStorage.setItem(LAST_USERNAME_KEY, data.username);
    } catch {}
    setAuthMessage(`Welcome back ${data.username}`);
    connectSocket(networkState.token);
    return true;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    networkState.token = "";
    setAuthMessage("Session expired, login again.");
    return false;
  }
}

function resetInventoryState() {
  // Clear corrupted localStorage and reset inventory to defaults
  localStorage.removeItem(getInventoryStorageKey());
  // Also clear legacy global key if it exists
  localStorage.removeItem(INVENTORY_ITEMS_KEY);
  if (ONLINE_MODE && networkState.connected) {
    sendSocket({ type: "inventory_update", inventory: {} });
  }
  inventory[1] = 0;
  inventory[2] = 0;
  inventory[3] = 0;
  inventory[4] = 0;
  inventory[5] = 0;
  inventory[6] = 0;
  inventory[8] = 0;
  inventory[9] = 0;
  inventory[10] = 0;
  inventory[11] = 0;
  inventory[12] = 0;
  inventory[13] = 0;
  inventory[14] = 0;
  inventory[15] = 0;
  inventory[16] = 0;
  inventory[17] = 0;
  
  // Remove any stray keys
  const validKeys = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  for (const key in inventory) {
    if (!validKeys.includes(parseInt(key))) {
      delete inventory[key];
    }
  }
  
  console.log("Inventory reset! Reloading page...");
  setTimeout(() => window.location.reload(), 500);
}

window.resetInventory = resetInventoryState;

function debugInventory() {
  console.log("=== INVENTORY DEBUG ===");
  console.log("In-memory inventory:", inventory);
  console.log("localStorage inventory:", JSON.parse(localStorage.getItem(getInventoryStorageKey()) || localStorage.getItem(INVENTORY_ITEMS_KEY) || "{}"));
  console.log("hotbarOrder:", hotbarOrder);
  console.log("itemDefs keys:", Object.keys(itemDefs).map(k => `${k}: ${itemDefs[k].name}`));
  
  // Check what would be rendered
  console.log("=== WHAT WILL BE RENDERED ===");
  hotbarOrder.forEach((tile, idx) => {
    const count = inventory[tile] || 0;
    if (count > 0) {
      const item = itemDefs[tile];
      console.log(`Slot ${idx}: ID ${tile} = ${item.name} x${count}`);
    }
  });
}

window.debugInventory = debugInventory;

function requestGrowingPlants() {
  if (ONLINE_MODE && networkState.connected) {
    sendSocket({ type: "get_growing_plants" });
  }
}

function requestLockedAreas() {
  if (ONLINE_MODE && networkState.connected) {
    sendSocket({ type: "get_locked_areas" });
  }
}

function requestDrops() {
  if (ONLINE_MODE && networkState.connected) {
    sendSocket({ type: "get_drops" });
  }
}

async function setupAuthPanel() {
  lockGameplay();
  loadSettings();
  await refreshAssetManifest();
  startAssetManifestSync();
  preloadPlayerSprites();
  setupMenuInteractions();
  setupChatUI();
  setupFriendsChatUI();
  renderChatHistory();
  bootChatHistoryPruner();
  loadInventoryState();

  if (!ONLINE_MODE) {
    redirectToLogin("Please login to play.");
    loadGrowingPlants(); // Load saved plants for singleplayer
    gameplayUnlocked = true;
    requestGrowingPlants();
    requestLockedAreas();
    requestDrops();
    return;
  }

  setOnlineBadge(false, "Offline");
  setAuthMessage(`World: ${WORLD_NAME} | Validating your session...`);
  localStorage.setItem("agetopia_world", WORLD_NAME);

  if (!networkState.token) {
    redirectToLogin("Please login or register to play.");
    return;
  }

  const resumed = await resumeSession();
  if (!resumed) {
    redirectToLogin("Session expired. Please login again.");
  } else {
    // Request growing plants and locked areas when world loads
    setTimeout(() => requestGrowingPlants(), 500);
    setTimeout(() => requestLockedAreas(), 500);
    setTimeout(() => requestDrops(), 500);
  }
}

function updatePlants(dt) {
  for (const [plantKey, plant] of growingPlants.entries()) {
    // Calculate progress based on time since planting
    const elapsed = Math.max(0, (Date.now() - plant.plantedAt) / 1000); // Convert to seconds
    plant.progress = Math.min(elapsed, plant.totalTime);
    
    // Check if fully grown
    if (plant.progress >= plant.totalTime && !plant.fullGrown) {
      // Mark as fully grown but keep the tile growing (still harvestable)
      plant.fullGrown = true;
    }
  }
}

function updateDrops(dt) {
  const now = Date.now();
  const playerTx = Math.max(0, Math.min(WORLD_WIDTH - 1, Math.floor((player.x + player.w * 0.5) / TILE)));
  const playerTy = Math.max(0, Math.min(WORLD_HEIGHT - 1, Math.floor((player.y + player.h * 0.5) / TILE)));
  for (const [dropId, drop] of drops.entries()) {
    const anchored = normalizeDropPosition(drop.x, drop.y);
    drop.x = anchored.x;
    drop.y = anchored.y;
    drop.floatY = anchored.y;
    drop.vx = 0;
    drop.vy = 0;

    drop.floatTime += dt;
    const dropTx = anchored.tx;
    const dropTy = anchored.ty;

    const pickupLockedUntil = Number(drop.pickupLockedUntil) || 0;
    if (now < pickupLockedUntil) {
      continue;
    }

    if (dropTx === playerTx && dropTy === playerTy) {
      const consumed = pickupDrop(drop, playerTx, playerTy);
      if (consumed) {
        drops.delete(dropId);
      }
    }
  }
}

function pickupDrop(drop, playerTx, playerTy) {
  const itemId = drop.tile;
  const dropCount = normalizeDropCount(drop.count);
  if (!inventory[itemId]) {
    inventory[itemId] = 0;
  }
  const currentAmount = inventory[itemId];
  const freeSpace = INVENTORY_STACK_LIMIT - currentAmount;
  if (freeSpace <= 0) {
    return false;
  }
  const collected = Math.min(freeSpace, dropCount);
  inventory[itemId] = currentAmount + collected;
  drop.count = dropCount - collected;
  
  // For seeds and blocks, move them to quick slots (first 5) if they're not already there
  const isSeed = (itemId >= 9 && itemId <= 14) || itemId === 17;
  const isBlock = (itemId >= 1 && itemId <= 7) || itemId === 15 || itemId === 16;
  
  if (isSeed || isBlock) {
    const currentIndex = hotbarOrder.indexOf(itemId);
    
    if (currentIndex >= 5) {
      // Item exists in hotbar but is past quick slots (position 5+)
      // Move it to the front so it appears in quick slots
      hotbarOrder.splice(currentIndex, 1);
      hotbarOrder.unshift(itemId);
    } else if (currentIndex === -1) {
      // Item not in hotbar, add to front of quick slots
      hotbarOrder.unshift(itemId);
    }
    // If already in positions 0-4, no change needed
  }
  
  saveInventoryItems();
  if (ONLINE_MODE && networkState.connected) {
    sendSocket({
      type: "drop_collect",
      id: drop.id,
      amount: collected,
      tx: playerTx,
      ty: playerTy,
      x: player.x,
      y: player.y,
    });
  }
  
  // Get item name from itemDefs (handles both blocks and seeds)
  const itemDef = itemDefs[itemId];
  const itemName = itemDef ? itemDef.name : "Unknown Item";
  setAuthMessage(`+${collected} ${itemName}`);
  return drop.count <= 0;
}

function drawDrops() {
  for (const drop of drops.values()) {
    const px = drop.x - camera.x;
    const py = drop.y - camera.y;
    const bobOffset = Math.sin(drop.floatTime * 3) * Math.max(1, Math.min(6, DROP_FLOAT_SPEED / 20));
    
    // Prefer item definition for icon-based drop rendering.
    const itemDef = itemDefs[drop.tile] || null;
    const tileDef = tileDefs[drop.tile] || null;
    const def = itemDef || tileDef;
    
    if (!def) continue; // Skip if item/tile doesn't exist
    
    ctx.save();
    ctx.globalAlpha = 0.9;
    
    const isSeed = (drop.tile >= 9 && drop.tile <= 14) || drop.tile === 17 || (def?.name && def.name.toLowerCase().includes("seed"));
    
    if (isSeed) {
      // Prefer icon if present (avoids lava seed looking like a block)
      const seedIconSrc = itemDef?.icon || def.icon || null;
      const iconImg = seedIconSrc ? getTexture(seedIconSrc) : null;
      if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
        const size = 20;
        ctx.drawImage(iconImg, px - size / 2, py - size / 2 + bobOffset, size, size);
      } else {
        // Draw seeds as ovals; lava seeds get a hotter gradient and darker rim
        const width = 14;
        const height = 20;
        if (drop.tile === 17) {
          const grad = ctx.createLinearGradient(px, py - 10 + bobOffset, px, py + 10 + bobOffset);
          grad.addColorStop(0, "#ffb25c");
          grad.addColorStop(0.6, "#f46b2d");
          grad.addColorStop(1, "#b71c1c");
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = def.color;
        }
        ctx.beginPath();
        ctx.ellipse(px, py - 2 + bobOffset, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = drop.tile === 17 ? "#5b0c0c" : "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(px, py - 2 + bobOffset, width / 2, height / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Prefer item icon for block drops, then block texture, then color.
      const blockIconSrc = itemDef?.icon || tileDef?.texture || def.icon || null;
      const iconImg = blockIconSrc ? getTexture(blockIconSrc) : null;
      const size = 20;
      if (iconImg && iconImg.complete && iconImg.naturalWidth > 0) {
        ctx.drawImage(iconImg, px - size / 2, py - size / 2 + bobOffset, size, size);
      } else {
        ctx.fillStyle = def.color;
        ctx.fillRect(px - size / 2, py - size / 2 + bobOffset, size, size);

        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(px - size / 2, py - size / 2 + bobOffset, size, size);
      }
    }

    const stackCount = normalizeDropCount(drop.count);
    if (stackCount > 1) {
      const labelX = px + 12;
      const labelY = py + 12 + bobOffset;
      ctx.font = "bold 12px 'Segoe UI', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(0,0,0,0.7)";
      ctx.strokeText(`x${stackCount}`, labelX, labelY);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`x${stackCount}`, labelX, labelY);
    }
    
    ctx.restore();
  }
}

function respawnLocal() {
  const spawn = getDoorSpawnPosition();
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.pendingNudgeX = 0;
  player.pendingNudgeY = 0;
  player.pendingNudgeTime = 0;
  player.knockbackUntil = 0;
  player.health = MAX_HEALTH;
  setAuthMessage("Respawned at spawn.");
}

function findLavaTouchAtPosition(px, py, pW, pH) {
  const contactLeft = px + LAVA_CONTACT_INSET;
  const contactRight = px + pW - LAVA_CONTACT_INSET;
  const contactTop = py + LAVA_CONTACT_INSET;
  const contactBottom = py + pH - LAVA_CONTACT_INSET;
  const scanEpsilon = 0.001;
  const scanPadding = LAVA_TOUCH_TOLERANCE + scanEpsilon;
  const scanLeft = Math.max(0, Math.floor((contactLeft - scanPadding) / TILE));
  const scanRight = Math.min(WORLD_WIDTH - 1, Math.floor((contactRight + scanPadding) / TILE));
  const scanTop = Math.max(0, Math.floor((contactTop - scanPadding) / TILE));
  const scanBottom = Math.min(WORLD_HEIGHT - 1, Math.floor((contactBottom + scanPadding) / TILE));
  const overlapLeft = contactLeft - LAVA_TOUCH_TOLERANCE;
  const overlapRight = contactRight + LAVA_TOUCH_TOLERANCE;
  const overlapTop = contactTop - LAVA_TOUCH_TOLERANCE;
  const overlapBottom = contactBottom + LAVA_TOUCH_TOLERANCE;

  for (let ty = scanTop; ty <= scanBottom; ty += 1) {
    for (let tx = scanLeft; tx <= scanRight; tx += 1) {
      if (getTile(tx, ty) !== LAVA_TILE) continue;
      const tileX = tx * TILE;
      const tileY = ty * TILE;
      const xOverlap = overlapRight >= tileX && overlapLeft <= tileX + TILE;
      const yOverlap = overlapBottom >= tileY && overlapTop <= tileY + TILE;
      if (xOverlap && yOverlap) {
        return { tx, ty };
      }
    }
  }
  return null;
}

function findLavaTouchAlongPath(fromX, fromY, toX, toY, pW, pH) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const travel = Math.max(Math.abs(dx), Math.abs(dy));
  const steps = Math.max(1, Math.ceil(travel / LAVA_SWEEP_STEP_PX));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sampleX = fromX + dx * t;
    const sampleY = fromY + dy * t;
    const lavaHit = findLavaTouchAtPosition(sampleX, sampleY, pW, pH);
    if (lavaHit) return lavaHit;
  }
  return null;
}

function handleLavaDamage(now, fromX = player.x, fromY = player.y) {
  if (ONLINE_MODE && networkState.connected) return; // Server is authoritative in online mode

  const lavaHit = findLavaTouchAlongPath(fromX, fromY, player.x, player.y, player.w, player.h);

  if (!lavaHit) return;
  if (player.lastLavaHitAt && now - player.lastLavaHitAt < LAVA_COOLDOWN_MS) return;
  player.lastLavaHitAt = now;

  const lavaCenterX = lavaHit.tx * TILE + TILE * 0.5;
  const playerCenterX = player.x + player.w * 0.5;
  const dir = Math.sign(playerCenterX - lavaCenterX) || (player.facing || 1);
  const knockVX = LAVA_KNOCKBACK * dir;
  const knockVY = -KNOCKBACK_LIFT;
  const nudgeX = dir * 22;
  const nudgeY = -10;

  queueSmoothNudge(nudgeX, nudgeY);
  player.vx += knockVX;
  player.vy = Math.min(player.vy, knockVY);
  player.knockbackUntil = Math.max(player.knockbackUntil, now + KNOCKBACK_RECOVERY_MS);
  player.onGround = false;
  resolvePlayerOverlap();
  player.health = Math.max(0, player.health - LAVA_DAMAGE);
  setAuthMessage("Ouch! Lava burns.");

  if (player.health <= 0) {
    respawnLocal();
  }
}

function update(dt, now) {
  if (!gameplayUnlocked) {
    return;
  }

  const moveLeft = keys.has("KeyA") || keys.has("ArrowLeft");
  const moveRight = keys.has("KeyD") || keys.has("ArrowRight");
  const moveDown = keys.has("KeyS") || keys.has("ArrowDown");
  const jumpHeld = keys.has("KeyW") || keys.has("ArrowUp") || keys.has("Space");

  let desiredVX = 0;
  if (moveLeft) desiredVX -= player.speed;
  if (moveRight) desiredVX += player.speed;

  const knockbackControlScale = now < player.knockbackUntil ? 0.35 : 1;
  const accel = (player.onGround ? 0.24 : 0.12) * knockbackControlScale;
  player.vx += (desiredVX - player.vx) * accel;

  if (Math.abs(player.vx) > 1) {
    player.facing = Math.sign(player.vx);
  }

  if (moveLeft !== moveRight) {
    player.animDirection = moveLeft ? "left" : "right";
  } else if (!player.onGround) {
    player.animDirection = player.vy < -40 ? "up" : "down";
  } else if (moveDown) {
    player.animDirection = "down";
  }

  player.isMoving =
    Math.abs(player.vx) > 8 ||
    Math.abs(player.vy) > 40 ||
    moveDown;

  const jumpPressed = jumpHeld && !jumpHeldLastFrame;
  const jumpReleased = !jumpHeld && jumpHeldLastFrame;

  if (jumpPressed && player.onGround) {
    player.vy = -player.jump;
    player.onGround = false;
  }

  if (jumpReleased && player.vy < -JUMP_RELEASE_VELOCITY) {
    // Releasing jump early trims upward velocity for shorter jumps.
    player.vy = -JUMP_RELEASE_VELOCITY;
  }

  jumpHeldLastFrame = jumpHeld;

  player.vy += GRAVITY * dt;
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED;

  const prevX = player.x;
  const prevY = player.y;
  applyQueuedNudge(dt);
  moveWithCollisions(dt);
  resolvePlayerOverlap();
  handleLavaDamage(now, prevX, prevY);
  tryBreak(dt);
  tryPlace();
  updateDrops(dt);
  updatePlants(dt);

  if (leftDown && breakState.targetX >= 0 && now >= player.nextPunchAt) {
    player.punchUntil = Math.max(player.punchUntil, now + 70);
  }

  updateCamera();

  if (networkState.connected && now - networkState.lastPositionSentAt > 50) {
    sendSocket({ type: "player_move", x: player.x, y: player.y, facing: player.facing });
    networkState.lastPositionSentAt = now;
  }

  updateHUD();
}

function draw() {
  if (!gameplayUnlocked) {
    drawBackground();
    return;
  }

  drawBackground();
  drawWorld();
  drawGrowingPlants();
  if (settingsState.showReachRing) {
    drawReachRing();
  }
  const attackStrength = Math.max(0, player.punchUntil - currentNow) / PUNCH_ANIM_MS;
  drawPlayerBody(player.x, player.y, player.facing, "#1f3b7c", attackStrength, player.animDirection, player.isMoving);
  const playerIsOwner = worldOwner && String(networkState.userId) === String(worldOwner.userId);
  drawHealthBar(player.x, player.y, player.health, player.maxHealth, networkState.username || "You", playerIsOwner);
  const selfId = networkState.playerId || networkState.userId;
  const myBubble = selfId ? chatBubbles.get(selfId) : null;
  if (myBubble && myBubble.expiresAt > currentNow) {
    drawChatBubble(player.x, player.y, myBubble.text);
  } else if (myBubble && myBubble.expiresAt <= currentNow && selfId) {
    chatBubbles.delete(selfId);
  }
  drawRemotePlayers();
  drawDrops();
  drawSelection();
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  currentNow = now;

  update(dt, now);
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (e) => {
  if (!gameplayUnlocked) return;

  if (isChatFocused()) {
    if (e.code === "Enter") {
      e.preventDefault();
      sendChatMessage();
      chatBar?.classList.add("hidden");
      chatInput?.blur();
    } else if (e.code === "Escape") {
      e.preventDefault();
      chatBar?.classList.add("hidden");
      chatInput?.blur();
    }
    return;
  }

  keys.add(e.code);

  // Check for door exit interaction
  if (e.code === "KeyE") {
    const px = Math.floor((player.x + player.w * 0.5) / TILE);
    const py = Math.floor((player.y + player.h * 0.5) / TILE);
    
    // Check door tile and adjacent tiles
    const tiles = [
      getTile(px, py),
      getTile(px, py - 1),
      getTile(px, py + 1),
      getTile(px - 1, py),
      getTile(px + 1, py),
    ];
    
    if (tiles.some(t => t === 7)) {  // Door tile
      exitWorld();
      return;
    }
  }

  if (e.code.startsWith("Digit")) {
    const idx = Number(e.code.slice(-1)) - 1;
    if (idx >= 0 && idx < hotbarOrder.length) {
      selectedSlot = idx;
    }

    const digitValue = Number(e.code.slice(-1));
    if (digitValue >= 1 && digitValue <= 3) {
      handleDigitCombo(digitValue, currentNow);
    }
  }

  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault();
  }
});

window.addEventListener("keyup", (e) => {
  if (!gameplayUnlocked) return;
  keys.delete(e.code);
});

canvas.addEventListener("mousemove", (e) => {
  if (!gameplayUnlocked) return;
  const rect = canvas.getBoundingClientRect();
  mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
  mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener("mousedown", (e) => {
  if (!gameplayUnlocked) return;
  if (e.button === 0) {
    // Left click: place blocks (or punch if punch is selected)
    leftDown = true;
    const isPunchSelected = selectedSlot === -1; // -1 means punch button selected
    if (isPunchSelected) {
      tryPunchPlayer(currentNow);
    }
  }
});

window.addEventListener("mouseup", (e) => {
  if (!gameplayUnlocked) return;
  if (e.button === 0) leftDown = false;
});

// Mobile touch punching/breaking blocks - track mouse position and update punch/place based on mode
canvas.addEventListener("touchmove", (e) => {
  if (!gameplayUnlocked) return;
  e.preventDefault();
  const touch = e.touches[0];
  if (!touch) return;
  const rect = canvas.getBoundingClientRect();
  mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
  mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
});

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

// Mobile touch controls
const mobileControls = {
  up: false,
  down: false,
  left: false,
  right: false,
};

function setupMobileControls() {
  const btnLeft = document.getElementById("btnLeft");
  const btnRight = document.getElementById("btnRight");
  const btnJump = document.getElementById("btnJump");
  const btnFullscreen = document.getElementById("btnFullscreen");

  if (!btnLeft) return; // Controls not in DOM

  const setupButton = (btn, keyCode, mobileKey) => {
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      mobileControls[mobileKey] = true;
      keys.add(keyCode);
    });
    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      mobileControls[mobileKey] = false;
      keys.delete(keyCode);
    });
    btn.addEventListener("mousedown", () => {
      mobileControls[mobileKey] = true;
      keys.add(keyCode);
    });
    btn.addEventListener("mouseup", () => {
      mobileControls[mobileKey] = false;
      keys.delete(keyCode);
    });
  };

  setupButton(btnLeft, "ArrowLeft", "left");
  setupButton(btnRight, "ArrowRight", "right");

  // Jump button
  btnJump.addEventListener("touchstart", (e) => {
    e.preventDefault();
    keys.add("Space");
  });
  btnJump.addEventListener("touchend", (e) => {
    e.preventDefault();
    keys.delete("Space");
  });
  btnJump.addEventListener("mousedown", () => {
    keys.add("Space");
  });
  btnJump.addEventListener("mouseup", () => {
    keys.delete("Space");
  });

  // Canvas touch handlers for punching/placing
  canvas.addEventListener("touchstart", (e) => {
    if (!gameplayUnlocked || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    leftDown = true;
    const isPunchSelected = selectedSlot === -1;
    if (isPunchSelected) {
      tryPunchPlayer(currentNow);
    }
  });

  canvas.addEventListener("touchend", (e) => {
    if (!gameplayUnlocked) return;
    e.preventDefault();
    leftDown = false;
  });

  canvas.addEventListener("touchmove", (e) => {
    if (!gameplayUnlocked || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    mouseX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    mouseY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
  });

  // Fullscreen button
  btnFullscreen.addEventListener("click", toggleFullscreen);
  btnFullscreen.addEventListener("touchend", (e) => {
    e.preventDefault();
    toggleFullscreen();
  });
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.log("Fullscreen request failed:", err);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

setupMobileControls();

setupAuthPanel().then(() => {
  updateHUD();
  requestAnimationFrame(frame);
});
