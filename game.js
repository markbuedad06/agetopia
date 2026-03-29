const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const statusEl = document.getElementById("status");
const inventoryEl = document.getElementById("inventory");
const quickSlotsEl = document.getElementById("quickSlots");
const btnPunch = document.getElementById("btnPunch");
const inventoryExpandBtn = document.getElementById("inventoryExpandBtn");
const inventoryModal = document.getElementById("inventoryModal");
const inventoryCloseBtn = document.getElementById("inventoryCloseBtn");
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
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const graphicsScaleEl = document.getElementById("graphicsScale");
const toggleReachRingEl = document.getElementById("toggleReachRing");
const toggleCloudsEl = document.getElementById("toggleClouds");

const TILE = 32;
const WORLD_WIDTH = 240;
const WORLD_HEIGHT = 90;
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
const INVENTORY_STACK_LIMIT = 99;
const MAX_HEALTH = 100;
const PUNCH_RANGE_TILES = 2.25;
const PUNCH_COOLDOWN_MS = 320;
const PUNCH_ANIM_MS = 180;
const DIGIT_COMBO_TIMEOUT_MS = 1600;
const KNOCKBACK_PUSH = 360;
const KNOCKBACK_LIFT = 240;
const DROP_PICKUP_RANGE = 40;
const DROP_FLOAT_SPEED = 80;
const LAVA_DAMAGE = 15;
const LAVA_COOLDOWN_MS = 900;
const LAVA_KNOCKBACK = 420;
const LAVA_TILE = 16;

const tileDefs = {
  0: { name: "Air", color: "rgba(0,0,0,0)", solid: false, hardness: 0, texture: null, rarity: 0 },
  1: { name: "Grass", color: "#62c462", solid: true, hardness: 0.3, texture: "assets/blocks/grass.svg", rarity: 1 },
  2: { name: "Dirt", color: "#8f5f3d", solid: true, hardness: 0.5, texture: "assets/blocks/dirt.svg", rarity: 1 },
  3: { name: "Stone", color: "#8d98a2", solid: true, hardness: 0.8, texture: "assets/blocks/stone.svg", rarity: 2 },
  4: { name: "Wood", color: "#c48a4d", solid: true, hardness: 0.4, texture: "assets/blocks/wood.svg", rarity: 1 },
  5: { name: "Cloud", color: "#dae9ff", solid: false, hardness: 0, texture: "assets/blocks/cloud.svg", rarity: 1 },
  6: { name: "123 Block", color: "#f59e0b", solid: true, hardness: 0.45, texture: "assets/blocks/block-123.svg", rarity: 3 },
   7: { name: "Door", color: "rgba(217, 119, 6, 0.3)", solid: false, hardness: 0, texture: "assets/blocks/door.svg", rarity: 0 },
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
  1: { name: "Grass Block", icon: "assets/items/grass-block.svg", color: "#62c462", rarity: 1 },
  2: { name: "Dirt Block", icon: "assets/items/dirt-block.svg", color: "#8f5f3d", rarity: 1 },
  3: { name: "Stone Block", icon: "assets/items/stone-block.svg", color: "#8d98a2", rarity: 1 },
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
let nextDropId = 1;

function makeDropId() {
  return `${networkState.userId || "local"}-${nextDropId++}`;
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
  renderScale: 1,
  showReachRing: true,
  showClouds: true,
};

function resizeCanvas() {
  const scale = Number(settingsState.renderScale) || 1;
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

function pseudoNoise(x) {
  return Math.sin(x * 0.14) * 0.55 + Math.sin(x * 0.047 + 23) * 0.3 + Math.sin(x * 0.008 + 60) * 0.15;
}

function generateWorld() {
  for (let x = 0; x < WORLD_WIDTH; x += 1) {
    const base = 46;
    const height = Math.floor(base + pseudoNoise(x) * 10);
    for (let y = 0; y < WORLD_HEIGHT; y += 1) {
      if (y < height) {
        setTile(x, y, 0);
      } else if (y === height) {
        setTile(x, y, 1);
      } else if (y < height + 4) {
        setTile(x, y, 2);
      } else {
        setTile(x, y, 3);
      }
    }

    if (x % 29 === 0) {
      const cloudY = 15 + (x % 7);
      for (let i = 0; i < 5; i += 1) {
        if (inBounds(x + i, cloudY)) setTile(x + i, cloudY, 5);
      }
    }

    if (x % 37 === 0 && x > 10 && x < WORLD_WIDTH - 10) {
      const trunkBase = height - 1;
      for (let t = 1; t <= 4; t += 1) {
        setTile(x, trunkBase - t, 4);
      }
      setTile(x - 1, trunkBase - 4, 1);
      setTile(x + 1, trunkBase - 4, 1);
      setTile(x, trunkBase - 5, 1);
    }
  }

  // Fill the bottom rows with lava to mirror server generation
  const lavaDepth = 3;
  for (let y = WORLD_HEIGHT - lavaDepth; y < WORLD_HEIGHT; y += 1) {
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      setTile(x, y, LAVA_TILE);
    }
  }
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

function getItemRarity(itemId) {
  return itemDefs[itemId]?.rarity || 1;
}

const player = {
  x: 15 * TILE,
  y: 30 * TILE,
  w: 24,
  h: TILE,
  vx: 0,
  vy: 0,
  speed: 290,
  jump: 500,
  onGround: false,
  facing: 1,
  reach: 5,
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  punchUntil: 0,
  nextPunchAt: 0,
  lastLavaHitAt: 0,
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

function isChatFocused() {
  return document.activeElement === chatInput;
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
      renderScale: Number(saved.renderScale) || 1,
      showReachRing: saved.showReachRing !== false,
      showClouds: saved.showClouds !== false,
    };
  } catch {
    settingsState = { renderScale: 1, showReachRing: true, showClouds: true };
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
  settingsState.renderScale = Number(graphicsScaleEl?.value || 1);
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
      if (isNaN(slotIndex) || slotIndex < 0 || slotIndex >= hotbarOrder.length) return;
      
      selectedSlot = slotIndex;
      updateHUD();
    });
  }
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

function getTexture(src) {
  if (!src) return null;
  if (textureCache.has(src)) return textureCache.get(src);

  const img = new Image();
  img.decoding = "async";
  img.src = src;
  textureCache.set(src, img);
  return img;
}

function drawBlockTexture(def, drawX, drawY) {
  const img = getTexture(def.texture);
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, drawX, drawY, TILE, TILE);
    return;
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

function moveWithCollisions(dt) {
  const nextX = player.x + player.vx * dt;
  if (!rectIntersectsSolid(nextX, player.y, player.w, player.h)) {
    player.x = nextX;
  } else {
    const step = Math.sign(player.vx) || 0;
    while (step !== 0 && !rectIntersectsSolid(player.x + step, player.y, player.w, player.h)) {
      player.x += step;
    }
    player.vx = 0;
  }

  const nextY = player.y + player.vy * dt;
  if (!rectIntersectsSolid(player.x, nextY, player.w, player.h)) {
    player.y = nextY;
    player.onGround = false;
  } else {
    const step = Math.sign(player.vy) || 0;
    while (step !== 0 && !rectIntersectsSolid(player.x, player.y + step, player.w, player.h)) {
      player.y += step;
    }
    if (player.vy > 0) player.onGround = true;
    player.vy = 0;
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
    player.x += nudgeX;
    player.y += nudgeY;
    player.vx += impulseX;
    player.vy = Math.min(player.vy, impulseY);
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
  
  // Can't break empty tiles unless there's a growing plant
  if ((tile === 0 || tile === 5 || tile === 7) && !plant) {
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
    // Trees break instantly
    hardness = 0;
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
        
        // Drop all the blocks with a very small spread
        for (let i = 0; i < dropCount; i++) {
          const dropId = makeDropId();
          const angle = (i / dropCount) * Math.PI * 2;
          const spread = 3; // tighter radial spawn distance
          const speed = 60; // lower launch speed for minimal explosion
          const drop = {
            id: dropId,
            tile: sourceBlock,
            x: dropX + Math.cos(angle) * spread,
            y: dropY + Math.sin(angle) * spread,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - speed,
            floatY: dropY,
            floatTime: 0,
          };
          drops.set(dropId, drop);
          if (ONLINE_MODE && networkState.connected) {
            sendSocket({ type: "drop_spawn", ...drop });
          }
        }
        
        // Low chance to also drop 1 seed
        if (Math.random() < 0.25) {
          const seedItem = 8 + sourceBlock;
          const dropId = makeDropId();
          const drop = {
            id: dropId,
            tile: seedItem,
            x: dropX,
            y: dropY,
            vx: (Math.random() - 0.5) * 120,
            vy: -90,
            floatY: dropY,
            floatTime: 0,
          };
          drops.set(dropId, drop);
          if (ONLINE_MODE && networkState.connected) {
            sendSocket({ type: "drop_spawn", ...drop });
          }
        }
      } else {
        // Break growing tree - low chance for seeds or nothing
        const dropX = tx * TILE + TILE / 2;
        const dropY = ty * TILE + TILE / 2;
        
        // 30% chance to drop a seed, 70% chance for nothing
        if (Math.random() < 0.3) {
          const seedItem = 8 + plant.sourceBlock; // Convert block to seed
          const dropId = nextDropId++;
          drops.set(dropId, {
            id: dropId,
            tile: seedItem,
            x: dropX,
            y: dropY,
            vx: (Math.random() - 0.5) * 120,
            vy: -90,
            floatY: dropY,
            floatTime: 0,
          });
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
        const dropId = makeDropId();
        const drop = {
          id: dropId,
          tile: dropItem,
          x: dropX,
          y: dropY,
          vx: (Math.random() - 0.5) * 100,
          vy: -80,
          floatY: dropY,
          floatTime: 0,
        };
        drops.set(dropId, drop);
        if (ONLINE_MODE && networkState.connected) {
          sendSocket({ type: "drop_spawn", ...drop });
        }
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

  // Check if there's already a growing plant at this location
  const plantKey = `${tx}:${ty}`;
  if (growingPlants.has(plantKey)) return;

  const selectedItem = hotbarOrder[selectedSlot];
  if (!inventory[selectedItem] || inventory[selectedItem] < 1) return;

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
  if (isSeedItem(selectedItem)) {
    // Plant seed - keep tile empty (0) and track in growingPlants map
    const rarity = getItemRarity(selectedItem);
    const growthTime = getGrowthTimeSeconds(rarity);
    // Calculate random drop count based on rarity (higher rarity = more drops)
    const baseDrops = 2 + rarity;
    const dropCount = baseDrops + (Math.random() < 0.5 ? 1 : 0);
    const plantedAt = Date.now();
    const seedSourceBlock = getSeedSourceBlock(selectedItem);
    const growingTile = getSeedGrowingTile(selectedItem);
    if (!seedSourceBlock || growingTile === null) return;
    growingPlants.set(plantKey, { 
      progress: 0, 
      totalTime: growthTime, 
      dropCount: dropCount,
      sourceBlock: seedSourceBlock,
      fullGrown: false,
      plantedAt: plantedAt
    });
    setTile(tx, ty, 0);
    // Suppress breaking for 500ms after planting to prevent instant destruction
    suppressBreakUntil = currentNow + 500;
    // Send plant info to server
    sendSocket({ 
      type: "plant_seed", 
      x: tx, 
      y: ty, 
      sourceBlock: seedSourceBlock,
      dropCount: dropCount,
      totalTime: growthTime,
      plantedAt: plantedAt
    });
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
      const drawX = x * TILE - camera.x;
      const drawY = y * TILE - camera.y;
      drawBlockTexture(def, drawX, drawY);
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

function drawPlayerBody(worldX, worldY, facing, bodyColor, attackStrength = 0) {
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
    drawPlayerBody(p.x, p.y, p.facing, "#73318e", attackStrength);
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
  for (const [plantKey, plant] of growingPlants.entries()) {
    const [x, y] = plantKey.split(":").map(Number);
    const drawX = x * TILE - camera.x;
    const drawY = y * TILE - camera.y;
    
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
      
      // Draw timer text (no background)
      ctx.font = "bold 10px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(timerText, centerX, timerY);
      
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
      // Trees break instantly, show full bar
      hardness = 0.001;
    } else {
      hardness = tileDefs[tile]?.hardness ?? 1;
    }
    
    const ratio = hardness === 0.001 ? 1 : Math.min(1, breakState.progress / hardness);
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
      icon.src = item.icon;
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
    slot.className = `slot ${idx === selectedSlot ? "active" : ""}`;
    slot.setAttribute("data-slot-index", String(idx));
    slot.setAttribute("data-tile", String(tile));
    slot.style.borderBottom = `4px solid ${item.color}`;
    slot.style.cursor = "pointer";

    const key = document.createElement("span");
    key.className = "slot-key";
    key.textContent = `${idx + 1}`;

    const icon = document.createElement("img");
    icon.className = "slot-icon";
    icon.src = item.icon;
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
    slot.className = "slot loot";
    slot.setAttribute("data-tile", String(itemId));
    slot.style.borderBottom = `4px solid ${item.color}`;
    slot.style.cursor = "default";
    slot.style.opacity = "0.8";

    const icon = document.createElement("img");
    icon.className = "slot-icon";
    icon.src = item.icon;
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

  socket.addEventListener("message", (event) => {
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
          drops.set(d.id, { ...d });
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
          drops.set(d.id, { ...d });
        });
      }
      return;
    }

    if (msg.type === "drop_spawn") {
      const d = msg.drop;
      if (d && d.id != null) {
        drops.set(d.id, { ...d });
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
  setupMenuInteractions();
  setupChatUI();
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
  for (const [dropId, drop] of drops.entries()) {
    drop.vy += 1200 * dt;
    drop.vy = Math.min(drop.vy, 300);
    
    drop.y += drop.vy * dt;
    drop.x += drop.vx * dt;

    // Prevent drops from passing through solid tiles
    const halfSize = 10;
    const tileBelowX = Math.floor(drop.x / TILE);
    const tileBelowY = Math.floor((drop.y + halfSize) / TILE);
    if (isSolid(getTile(tileBelowX, tileBelowY))) {
      drop.y = tileBelowY * TILE - halfSize;
      drop.vy = 0;
      drop.vx *= 0.85;
    }
    
    drop.floatTime += dt;
    const floatPhase = Math.sin(drop.floatTime * 3) * DROP_FLOAT_SPEED;
    
    const playerCenter = player.x + player.w * 0.5;
    const playerCenterY = player.y + player.h * 0.5;
    const dx = drop.x - playerCenter;
    const dy = drop.y - playerCenterY;
    const dist = Math.hypot(dx, dy);
    
    if (dist < DROP_PICKUP_RANGE) {
      pickupDrop(drop);
      drops.delete(dropId);
    }
  }
}

function pickupDrop(drop) {
  const itemId = drop.tile;
  if (!inventory[itemId]) {
    inventory[itemId] = 0;
  }
  inventory[itemId] = Math.min(INVENTORY_STACK_LIMIT, inventory[itemId] + 1);
  
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
    sendSocket({ type: "drop_collect", id: drop.id });
  }
  
  // Get item name from itemDefs (handles both blocks and seeds)
  const itemDef = itemDefs[itemId];
  const itemName = itemDef ? itemDef.name : "Unknown Item";
  setAuthMessage(`+1 ${itemName}`);
}

function drawDrops() {
  for (const drop of drops.values()) {
    const px = drop.x - camera.x;
    const py = drop.y - camera.y;
    const bobOffset = Math.sin(drop.floatTime * 3) * 3;
    
    // Use itemDefs to get color (handles both blocks and seeds)
    const def = itemDefs[drop.tile] || tileDefs[drop.tile];
    
    if (!def) continue; // Skip if item/tile doesn't exist
    
    ctx.save();
    ctx.globalAlpha = 0.9;
    
    const isSeed = (drop.tile >= 9 && drop.tile <= 14) || drop.tile === 17 || (def?.name && def.name.toLowerCase().includes("seed"));
    
    if (isSeed) {
      // Prefer icon if present (avoids lava seed looking like a block)
      const iconImg = def.icon ? getTexture(def.icon) : null;
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
      // Draw blocks as squares
      const size = 20;
      ctx.fillStyle = def.color;
      ctx.fillRect(px - size / 2, py - size / 2 + bobOffset, size, size);
      
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px - size / 2, py - size / 2 + bobOffset, size, size);
    }
    
    ctx.restore();
  }
}

function respawnLocal() {
  const doorX = Math.floor(WORLD_WIDTH / 2);
  const doorBaseY = 46 + Math.floor(pseudoNoise(doorX) * 10);
  player.x = doorX * TILE;
  player.y = (doorBaseY - 2) * TILE;
  player.vx = 0;
  player.vy = 0;
  player.health = MAX_HEALTH;
  setAuthMessage("Respawned at spawn.");
}

function handleLavaDamage(now) {
  if (ONLINE_MODE && networkState.connected) return; // Server is authoritative in online mode

  const bounds = getPlayerTileBounds();
  const pW = player.w;
  const pH = player.h;
  const scanLeft = Math.max(0, bounds.left - 1);
  const scanRight = Math.min(WORLD_WIDTH - 1, bounds.right + 1);
  const scanTop = Math.max(0, bounds.top - 1);
  const scanBottom = Math.min(WORLD_HEIGHT - 1, bounds.bottom + 1);
  let lavaHit = null;
  for (let ty = scanTop; ty <= scanBottom; ty += 1) {
    for (let tx = scanLeft; tx <= scanRight; tx += 1) {
      if (getTile(tx, ty) !== LAVA_TILE) continue;
      const tileX = tx * TILE;
      const tileY = ty * TILE;
      const xOverlap = (player.x + pW) >= tileX && player.x <= tileX + TILE;
      const yOverlap = (player.y + pH) >= tileY && player.y <= tileY + TILE;
      if (xOverlap && yOverlap) {
        lavaHit = { tx, ty };
        break;
      }
    }
    if (lavaHit) break;
  }

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

  player.x += nudgeX;
  player.y += nudgeY;
  player.vx += knockVX;
  player.vy = Math.min(player.vy, knockVY);
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
  const jump = keys.has("KeyW") || keys.has("ArrowUp") || keys.has("Space");

  let desiredVX = 0;
  if (moveLeft) desiredVX -= player.speed;
  if (moveRight) desiredVX += player.speed;

  const accel = player.onGround ? 0.24 : 0.12;
  player.vx += (desiredVX - player.vx) * accel;

  if (Math.abs(player.vx) > 1) {
    player.facing = Math.sign(player.vx);
  }

  if (jump && player.onGround) {
    player.vy = -player.jump;
    player.onGround = false;
  }

  player.vy += 1200 * dt;
  if (player.vy > 900) player.vy = 900;

  moveWithCollisions(dt);
  handleLavaDamage(now);
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
  drawPlayerBody(player.x, player.y, player.facing, "#1f3b7c", attackStrength);
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
