import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, initDatabase, rowToProfile } from "./db.js";
import { requireAuth, signToken, type AuthedRequest } from "./auth.js";
import { seedDatabase } from "./seed.js";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

initDatabase();
seedDatabase();

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://final-swap-x.vercel.app",
];

const extraOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((o) => o.trim()).filter(Boolean)
  : [];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (defaultOrigins.includes(origin) || extraOrigins.includes(origin)) return true;

  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "http:" && protocol !== "https:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    // Allow all Vercel production + preview deployments
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {
    return false;
  }

  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

function getUserRow(userId: string) {
  return db.prepare("SELECT id, email, name FROM users WHERE id = ?").get(userId) as
    | { id: string; email: string; name: string }
    | undefined;
}

function pushNotification(
  userId: string,
  data: {
    title: string;
    message: string;
    type: string;
    link?: string;
    related_user_id?: string;
    chat_id?: string;
  }
) {
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, link, related_user_id, chat_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    crypto.randomUUID(),
    userId,
    data.title,
    data.message,
    data.type,
    data.link ?? null,
    data.related_user_id ?? null,
    data.chat_id ?? null
  );
}

// ─── Auth ───────────────────────────────────────────────────────────────────

app.post("/api/auth/signup", (req, res) => {
  const { email, password, name } = req.body as {
    email?: string;
    password?: string;
    name?: string;
  };

  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);

  db.prepare("INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)").run(
    userId,
    normalizedEmail,
    passwordHash,
    name.trim()
  );

  const token = signToken({ userId, email: normalizedEmail });
  const user = getUserRow(userId);

  res.status(201).json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const row = db
    .prepare("SELECT id, email, name, password_hash FROM users WHERE email = ?")
    .get(normalizedEmail) as
    | { id: string; email: string; name: string; password_hash: string }
    | undefined;

  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({ userId: row.id, email: row.email });
  res.json({
    token,
    user: { id: row.id, email: row.email, name: row.name },
  });
});

app.get("/api/auth/me", requireAuth, (req: AuthedRequest, res) => {
  const user = getUserRow(req.user!.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const profile = db
    .prepare("SELECT avatar_url FROM profiles WHERE id = ?")
    .get(user.id) as { avatar_url: string | null } | undefined;

  res.json({
    user: {
      ...user,
      avatar: profile?.avatar_url ?? undefined,
    },
  });
});

// ─── Profiles ───────────────────────────────────────────────────────────────

app.get("/api/profiles", requireAuth, (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM profiles ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  res.json(rows.map(rowToProfile));
});

app.get("/api/profiles/me", requireAuth, (req: AuthedRequest, res) => {
  const row = db
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(req.user!.userId) as Record<string, unknown> | undefined;

  if (!row) return res.json(null);
  res.json(rowToProfile(row));
});

app.get("/api/profiles/:id", requireAuth, (req, res) => {
  const row = db
    .prepare("SELECT * FROM profiles WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!row) return res.status(404).json({ error: "Profile not found" });
  res.json(rowToProfile(row));
});

app.post("/api/profiles", requireAuth, (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const userId = req.user!.userId;

  const existing = db.prepare("SELECT id FROM profiles WHERE id = ?").get(userId);
  if (existing) {
    return res.status(409).json({ error: "Profile already exists" });
  }

  db.prepare(`
    INSERT INTO profiles (id, username, full_name, avatar_url, bio, skills, skills_to_learn, desired_skills)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    (body.username as string) ?? null,
    (body.full_name as string) ?? null,
    (body.avatar_url as string) ?? null,
    (body.bio as string) ?? null,
    JSON.stringify(body.skills ?? []),
    JSON.stringify(body.skills_to_learn ?? []),
    JSON.stringify(body.desired_skills ?? body.skills_to_learn ?? [])
  );

  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(userId) as Record<
    string,
    unknown
  >;
  res.status(201).json(rowToProfile(row));
});

app.patch("/api/profiles/me", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const body = req.body as Record<string, unknown>;

  const existing = db.prepare("SELECT id FROM profiles WHERE id = ?").get(userId);
  if (!existing) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const fields: string[] = [];
  const values: unknown[] = [];

  const setField = (key: string, value: unknown, json = false) => {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(json ? JSON.stringify(value) : value);
    }
  };

  setField("username", body.username);
  setField("full_name", body.full_name);
  setField("avatar_url", body.avatar_url);
  setField("bio", body.bio);
  setField("skills", body.skills, true);
  setField("skills_to_learn", body.skills_to_learn, true);
  setField("desired_skills", body.desired_skills ?? body.skills_to_learn, true);
  setField("rating", body.rating);

  if (fields.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  values.push(userId);
  db.prepare(`UPDATE profiles SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM profiles WHERE id = ?").get(userId) as Record<
    string,
    unknown
  >;
  res.json(rowToProfile(row));
});

// ─── Connections ──────────────────────────────────────────────────────────

app.get("/api/connections", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const rows = db
    .prepare(`
      SELECT * FROM connections
      WHERE user_id = ? OR partner_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId, userId);
  res.json(rows);
});

app.post("/api/connections", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { partner_id, message, skill } = req.body as {
    partner_id?: string;
    message?: string;
    skill?: string;
  };

  if (!partner_id) {
    return res.status(400).json({ error: "partner_id is required" });
  }

  if (partner_id === userId) {
    return res.status(400).json({ error: "Cannot connect with yourself" });
  }

  const partner = getUserRow(partner_id);
  if (!partner) {
    return res.status(404).json({ error: "Partner not found" });
  }

  const existing = db
    .prepare(
      `SELECT * FROM connections
       WHERE (user_id = ? AND partner_id = ?) OR (user_id = ? AND partner_id = ?)`
    )
    .get(userId, partner_id, partner_id, userId) as Record<string, unknown> | undefined;

  if (existing) {
    return res.status(409).json({ error: "Connection already exists", connection: existing });
  }

  const result = db
    .prepare(
      `INSERT INTO connections (user_id, partner_id, status, message, skill)
       VALUES (?, ?, 'pending', ?, ?)`
    )
    .run(userId, partner_id, message ?? null, skill ?? null);

  const sender = getUserRow(userId)!;
  pushNotification(partner_id, {
    title: "New Connection Request",
    message: `${sender.name} wants to connect with you`,
    type: "connection",
    link: "/dashboard",
    related_user_id: userId,
  });

  const connection = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(connection);
});

app.patch("/api/connections/:id", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { status } = req.body as { status?: string };

  if (!status || !["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "status must be 'accepted' or 'rejected'" });
  }

  const connection = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!connection) {
    return res.status(404).json({ error: "Connection not found" });
  }

  if (connection.partner_id !== userId && connection.user_id !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  db.prepare("UPDATE connections SET status = ? WHERE id = ?").run(status, req.params.id);

  if (status === "accepted" && connection.user_id !== userId) {
    const accepter = getUserRow(userId)!;
    pushNotification(connection.user_id as string, {
      title: "Connection Accepted",
      message: `${accepter.name} accepted your connection request`,
      type: "connection",
      link: `/chat/${userId}`,
      related_user_id: userId,
    });
  }

  const updated = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(req.params.id);
  res.json(updated);
});

// ─── Messages ───────────────────────────────────────────────────────────────

app.get("/api/connections/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const connection = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!connection) return res.status(404).json({ error: "Connection not found" });
  if (connection.user_id !== userId && connection.partner_id !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const messages = db
    .prepare("SELECT * FROM messages WHERE connection_id = ? ORDER BY created_at ASC")
    .all(req.params.id);
  res.json(messages);
});

app.post("/api/connections/:id/messages", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { content } = req.body as { content?: string };

  if (!content?.trim()) {
    return res.status(400).json({ error: "content is required" });
  }

  const connection = db
    .prepare("SELECT * FROM connections WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!connection) return res.status(404).json({ error: "Connection not found" });
  if (connection.status !== "accepted") {
    return res.status(403).json({ error: "Connection must be accepted to send messages" });
  }
  if (connection.user_id !== userId && connection.partner_id !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const result = db
    .prepare("INSERT INTO messages (connection_id, sender, content) VALUES (?, ?, ?)")
    .run(req.params.id, userId, content.trim());

  const partnerId =
    connection.user_id === userId ? (connection.partner_id as string) : (connection.user_id as string);
  const sender = getUserRow(userId)!;

  pushNotification(partnerId, {
    title: "New Message",
    message: `${sender.name}: ${content.trim().slice(0, 50)}`,
    type: "message",
    link: `/chat/${userId}`,
    chat_id: userId,
    related_user_id: userId,
  });

  const message = db.prepare("SELECT * FROM messages WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(message);
});

// ─── Meetings ───────────────────────────────────────────────────────────────

app.get("/api/meetings", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const meetings = db
    .prepare(
      `SELECT * FROM meetings
       WHERE from_user_id = ? OR to_user_id = ?
       ORDER BY date ASC`
    )
    .all(userId, userId);
  res.json(meetings);
});

app.post("/api/meetings", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { to_user_id, date, mode, location, link } = req.body as {
    to_user_id?: string;
    date?: string;
    mode?: string;
    location?: string;
    link?: string;
  };

  if (!to_user_id || !date || !mode) {
    return res.status(400).json({ error: "to_user_id, date, and mode are required" });
  }

  const id = `meeting-${Date.now()}`;
  db.prepare(`
    INSERT INTO meetings (id, from_user_id, to_user_id, date, mode, location, link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, to_user_id, date, mode, location ?? null, link ?? null);

  const sender = getUserRow(userId)!;
  pushNotification(to_user_id, {
    title: "Meeting Scheduled",
    message: `${sender.name} scheduled a meeting with you`,
    type: "meeting",
    link: link ?? `/chat/${userId}`,
    related_user_id: userId,
  });

  const meeting = db.prepare("SELECT * FROM meetings WHERE id = ?").get(id);
  res.status(201).json(meeting);
});

// ─── Calls ──────────────────────────────────────────────────────────────────

app.get("/api/calls/incoming", requireAuth, (req: AuthedRequest, res) => {
  const calls = db
    .prepare(
      `SELECT * FROM calls WHERE to_user_id = ? AND status = 'ringing' ORDER BY created_at DESC`
    )
    .all(req.user!.userId);
  res.json(calls);
});

app.post("/api/calls", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { to_user_id, link, type } = req.body as {
    to_user_id?: string;
    link?: string;
    type?: string;
  };

  if (!to_user_id || !link) {
    return res.status(400).json({ error: "to_user_id and link are required" });
  }

  db.prepare(
    `UPDATE calls SET status = 'missed', ended_at = datetime('now')
     WHERE to_user_id = ? AND status = 'ringing'`
  ).run(to_user_id);

  const id = `call-${Date.now()}`;
  db.prepare(`
    INSERT INTO calls (id, from_user_id, to_user_id, link, status, type)
    VALUES (?, ?, ?, ?, 'ringing', ?)
  `).run(id, userId, to_user_id, link, type ?? "video");

  const sender = getUserRow(userId)!;
  pushNotification(to_user_id, {
    title: "Incoming Call",
    message: `${sender.name} is calling you`,
    type: "call",
    link,
    related_user_id: userId,
  });

  const call = db.prepare("SELECT * FROM calls WHERE id = ?").get(id);
  res.status(201).json(call);
});

app.patch("/api/calls/:id", requireAuth, (req: AuthedRequest, res) => {
  const userId = req.user!.userId;
  const { status } = req.body as { status?: string };

  const call = db
    .prepare("SELECT * FROM calls WHERE id = ?")
    .get(req.params.id) as Record<string, unknown> | undefined;

  if (!call) return res.status(404).json({ error: "Call not found" });
  if (call.from_user_id !== userId && call.to_user_id !== userId) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const updates: string[] = ["status = ?"];
  const values: unknown[] = [status ?? "ended"];

  if (status === "answered") {
    updates.push("answered_at = datetime('now')");
  }
  if (status === "ended" || status === "missed") {
    updates.push("ended_at = datetime('now')");
  }

  values.push(req.params.id);
  db.prepare(`UPDATE calls SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const updated = db.prepare("SELECT * FROM calls WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// ─── Notifications ──────────────────────────────────────────────────────────

app.get("/api/notifications", requireAuth, (req: AuthedRequest, res) => {
  const notifications = db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
    )
    .all(req.user!.userId);
  res.json(
    notifications.map((n: Record<string, unknown>) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.is_read === 1,
      timestamp: n.created_at,
      link: n.link,
      userId: n.related_user_id,
      chatId: n.chat_id,
    }))
  );
});

app.patch("/api/notifications/:id/read", requireAuth, (req: AuthedRequest, res) => {
  db.prepare(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`
  ).run(req.params.id, req.user!.userId);
  res.json({ ok: true });
});

app.post("/api/notifications/read-all", requireAuth, (req: AuthedRequest, res) => {
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(req.user!.userId);
  res.json({ ok: true });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "SwapX API" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`SwapX API running on port ${PORT}`);
  console.log(`CORS: localhost + *.vercel.app${extraOrigins.length ? ` + ${extraOrigins.join(", ")}` : ""}`);
});
