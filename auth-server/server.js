
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

const DATA_DIR = '/opt/my-fp-zhiwen-personal/data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const SINGBOX_BIN = '/usr/local/bin/sing-box';
const RELAY_DIR = '/opt/my-fp-zhiwen-personal/relays';
const SYNC_DIR = '/opt/my-fp-zhiwen-personal/sync-data';
const PORT = 3000;

// 2026-04-19: cloud sync limits — keep these in lockstep with shared/syncTypes.ts
const SYNC_QUOTA_BYTES = 500 * 1024 * 1024;        // 500 MB / user hard cap
const SYNC_MAX_FILE_BYTES = 50 * 1024 * 1024;      // 50 MB / single file
const SNAPSHOT_MAX_BYTES = 5 * 1024 * 1024;        // 5 MB cap on the metadata JSON itself
const MANIFEST_MAX_BYTES = 5 * 1024 * 1024;

const activeRelays = new Map();

function ensureFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(USERS_FILE)) {
    // Personal edition: never ship a built-in account or password.
    fs.writeFileSync(USERS_FILE, '[]');
  }
  if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, '[]');
}

function loadUsers() { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
function saveUsers(u) { fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2)); }
function loadSessions() { try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8')); } catch { return []; } }
function saveSessions(s) { fs.writeFileSync(SESSIONS_FILE, JSON.stringify(s, null, 2)); }
function hashPwd(p) { return crypto.createHash('sha256').update(p).digest('hex'); }
function genToken() { return crypto.randomBytes(32).toString('hex'); }

function parseBody(req, maxBytes = 8 * 1024 * 1024) {
  // 2026-04-19: bumped from 1 MB → 8 MB so cloud-sync snapshots / manifests
  // (capped at 5 MB each on the route layer) fit comfortably.
  return new Promise((resolve) => {
    let b = '';
    req.on('data', c => { b += c; if (b.length > maxBytes) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve({}); } });
  });
}

function json(res, code, data) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function html(res, content) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(content);
}

function cleanExpired() {
  const s = loadSessions();
  const now = Date.now();
  const valid = s.filter(x => x.expiresAt > now);
  if (valid.length !== s.length) saveSessions(valid);
  return valid;
}

function getSessionUser(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  const sessions = cleanExpired();
  return sessions.find(s => s.token === token) || null;