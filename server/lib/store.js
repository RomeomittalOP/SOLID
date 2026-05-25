/**
 * Tiny JSON-file store for enquiries.
 * Pure Node (no native modules) so it deploys on any host. Writes atomically.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATA_DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "enquiries.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]", "utf8");
}

function readAll() {
  ensure();
  try {
    return JSON.parse(fs.readFileSync(FILE, "utf8") || "[]");
  } catch {
    return [];
  }
}

function writeAll(list) {
  ensure();
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2), "utf8");
  fs.renameSync(tmp, FILE); // atomic replace
}

function add(entry) {
  const list = readAll();
  const record = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    handled: false,
    ...entry,
  };
  list.unshift(record); // newest first
  writeAll(list);
  return record;
}

function list({ handled } = {}) {
  let items = readAll();
  if (handled === true) items = items.filter((e) => e.handled);
  if (handled === false) items = items.filter((e) => !e.handled);
  return items;
}

function update(id, patch) {
  const items = readAll();
  const i = items.findIndex((e) => e.id === id);
  if (i === -1) return null;
  items[i] = { ...items[i], ...patch };
  writeAll(items);
  return items[i];
}

function remove(id) {
  const items = readAll();
  const next = items.filter((e) => e.id !== id);
  if (next.length === items.length) return false;
  writeAll(next);
  return true;
}

function stats() {
  const items = readAll();
  return {
    total: items.length,
    pending: items.filter((e) => !e.handled).length,
    handled: items.filter((e) => e.handled).length,
  };
}

module.exports = { add, list, update, remove, stats };
