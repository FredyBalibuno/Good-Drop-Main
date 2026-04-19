import http from "node:http";
import { config } from "dotenv";
import { MongoClient, ObjectId } from "mongodb";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";

config();

const PORT = Number(process.env.PORT ?? 3001);
const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "gooddrop";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

const CHAT_SYSTEM = `You are a donation assistant for Goodwill of Greater Washington (DC Goodwill).
Your ONLY purpose is to help donors understand what Goodwill will and will not accept.
Do NOT answer questions unrelated to Goodwill donation guidelines.
If asked anything off-topic, politely redirect back to donation questions.

DC GOODWILL ACCEPTANCE RULES:

CLOTHING — ACCEPT if: clean, no stains, no holes/rips/tears, no pet hair, no mildew/odor, wearable condition. Vintage and new-with-tags especially welcome.
CLOTHING — REJECT if: any visible stains, holes or tears, excessive pet hair, mildew smell, extreme fading.

ELECTRONICS — ACCEPT: flat-screen TVs (LCD/LED/OLED), small appliances (toasters, coffee makers, microwaves, vacuums, blenders), computers in ANY condition, gaming consoles, radios/stereos, lamps, fans, software under 2 years old.
ELECTRONICS — REJECT: CRT/tube TVs (thick boxy old-style), large appliances (fridges, stoves, washers, dryers, dishwashers), visibly broken with no repair potential.

FURNITURE — ACCEPT if: clean, under ~50 lbs, no rips/stains/pet hair, structurally intact, all parts present.
FURNITURE — REJECT if: stained/mildewed/rusty, missing parts, broken, covered in pet hair, torn upholstery, over 50 lbs or very large.

BOOKS & MEDIA — ACCEPT: hardback/paperback books in readable condition, textbooks, CDs/DVDs/Blu-rays in cases, vinyl records, video games.
BOOKS & MEDIA — REJECT: water-damaged or moldy books, pages falling out, very outdated software (5+ years).

HOUSEWARES — ACCEPT: kitchenware, dishes, glasses, cookware in good condition, home decor, clean functional items.
HOUSEWARES — REJECT: broken items, major chips/cracks, opened cosmetics/personal care, food/beverages.

TOYS & SPORTS — ACCEPT: toys in good condition, stuffed animals, complete games/puzzles, sporting equipment, exercise equipment under 50 lbs.
TOYS & SPORTS — REJECT: broken toys with sharp edges, games with missing pieces, damaged sporting equipment, exercise equipment over 50 lbs.

NEVER ACCEPTED (regardless of condition):
- Mattresses, box springs, bed rails, sleeper sofas, air mattresses, bed pillows, bean bags
- Cribs, strollers, car seats, highchairs, playpens, changing tables, bassinets, baby walkers
- Refrigerators, freezers, washing machines, dryers, stoves, dishwashers, hot water heaters
- Windows, doors, lumber, concrete, bricks, sinks, toilets, bathtubs
- Paint, chemicals, gasoline, pesticides, propane tanks
- Firearms, ammunition, fireworks
- CRT/tube televisions
- Medical equipment, crutches
- Tires, car batteries, motor oil
- Rags

When an item is rejected, always suggest an alternative disposal option (recycling, other charities, etc.).
Be warm, practical, and concise — 2-3 sentences max per response.
If genuinely unsure, suggest the donor call their local Goodwill to confirm.`;

/** @type {MongoClient | null} */
let client = null;

async function getDb() {
  if (!URI) return null;
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

const DEFAULT_DEMAND = {
  highNeed: [
    { id: "h1", label: "Men's jackets" },
    { id: "h2", label: "Children's shoes" },
    { id: "h3", label: "Kitchen appliances in working condition" },
    { id: "h4", label: "Gently used linens" },
  ],
  lowNeed: [
    { id: "l1", label: "Office chairs" },
    { id: "l2", label: "Large desks" },
    { id: "l3", label: "DVDs & CDs" },
    { id: "l4", label: "Casual shirts & tops" },
  ],
  notAccepted: [
    { id: "n1", label: "Broken electronics" },
    { id: "n2", label: "Torn or heavily stained clothing" },
    { id: "n3", label: "Mattresses" },
    { id: "n4", label: "Car seats (expired or without manual)" },
  ],
};

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
    "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

/** @param {import('node:http').IncomingMessage} req */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": process.env.CORS_ORIGIN ?? "*",
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,PATCH,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    const db = await getDb();
    if (!db) return sendJson(res, 503, { error: "MONGODB_URI is not set" });

    // ── POST /api/auth/google ────────────────────────────────────────
    if (pathname === "/api/auth/google" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.credential) return sendJson(res, 400, { error: "Missing credential" });
      const ticket = await googleClient.verifyIdToken({
        idToken: body.credential,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub) return sendJson(res, 401, { error: "Invalid token" });

      const existing = await db.collection("users").findOne({ _id: payload.sub });
      const user = {
        _id: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        rating: existing?.rating ?? 0,
        pickupUnlocked: existing?.pickupUnlocked ?? false,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
      };
      await db.collection("users").updateOne(
        { _id: payload.sub },
        { $set: { ...user, updatedAt: new Date() } },
        { upsert: true },
      );
      const { _id, ...rest } = user;
      return sendJson(res, 200, { id: _id, ...rest });
    }

    // ── GET /api/users/:id ───────────────────────────────────────────
    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && req.method === "GET") {
      const userId = userMatch[1];
      const user = await db.collection("users").findOne({ _id: userId });
      if (!user) return sendJson(res, 404, { error: "User not found" });
      const submissions = await db.collection("submissions").find({ userId }).sort({ createdAt: -1 }).toArray();
      const { _id, ...rest } = user;
      return sendJson(res, 200, {
        ...rest,
        id: _id,
        submissions: submissions.map(({ _id: sid, ...s }) => s),
      });
    }

    // ── PUT /api/users/:id/rating ────────────────────────────────────
    const ratingMatch = pathname.match(/^\/api\/users\/([^/]+)\/rating$/);
    if (ratingMatch && req.method === "PUT") {
      const userId = ratingMatch[1];
      const body = await readBody(req);
      if (typeof body?.rating !== "number") return sendJson(res, 400, { error: "Expected { rating: number }" });
      const rating = Math.min(5, Math.max(0, body.rating));
      const pickupUnlocked = rating >= 4.0;
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: { rating, pickupUnlocked, updatedAt: new Date() } },
      );
      return sendJson(res, 200, { ok: true, rating, pickupUnlocked });
    }

    // ── GET /api/users ───────────────────────────────────────────────
    if (pathname === "/api/users" && req.method === "GET") {
      const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
      return sendJson(res, 200, users.map(({ _id, ...u }) => ({ id: _id, ...u })));
    }

    // ── GET /api/demand ──────────────────────────────────────────────
    if (pathname === "/api/demand" && req.method === "GET") {
      const doc = await db.collection("demand").findOne({ _id: "singleton" });
      return sendJson(res, 200, doc ?? DEFAULT_DEMAND);
    }

    // ── PUT /api/demand ──────────────────────────────────────────────
    if (pathname === "/api/demand" && req.method === "PUT") {
      const body = await readBody(req);
      if (!body) return sendJson(res, 400, { error: "Expected JSON body" });
      await db.collection("demand").updateOne(
        { _id: "singleton" },
        { $set: { ...body, updatedAt: new Date() } },
        { upsert: true },
      );
      return sendJson(res, 200, { ok: true });
    }

    // ── GET /api/submissions ─────────────────────────────────────────
    if (pathname === "/api/submissions" && req.method === "GET") {
      const docs = await db.collection("submissions").find({}).sort({ createdAt: -1 }).toArray();
      return sendJson(res, 200, docs.map(({ _id, ...rest }) => rest));
    }

    // ── POST /api/submissions ────────────────────────────────────────
    if (pathname === "/api/submissions" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.id) return sendJson(res, 400, { error: "Expected submission with id" });
      await db.collection("submissions").updateOne(
        { _id: body.id },
        { $set: { ...body, updatedAt: new Date() } },
        { upsert: true },
      );
      return sendJson(res, 201, { ok: true });
    }

    // ── DELETE /api/submissions ──────────────────────────────────────
    if (pathname === "/api/submissions" && req.method === "DELETE") {
      await db.collection("submissions").deleteMany({});
      return sendJson(res, 200, { ok: true });
    }

    // ── GET /api/pickup-requests ─────────────────────────────────────
    if (pathname === "/api/pickup-requests" && req.method === "GET") {
      const docs = await db.collection("pickupRequests").find({}).sort({ createdAt: -1 }).toArray();
      return sendJson(res, 200, docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })));
    }

    // ── POST /api/pickup-requests ────────────────────────────────────
    if (pathname === "/api/pickup-requests" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.userId || !body?.address) return sendJson(res, 400, { error: "Missing required fields" });
      const doc = {
        ...body,
        status: "pending",
        createdAt: new Date().toISOString(),
      };
      const result = await db.collection("pickupRequests").insertOne(doc);
      return sendJson(res, 201, { ok: true, id: result.insertedId.toString() });
    }

    // ── PATCH /api/pickup-requests/:id ───────────────────────────────
    const pickupMatch = pathname.match(/^\/api\/pickup-requests\/([^/]+)$/);
    if (pickupMatch && req.method === "PATCH") {
      const id = pickupMatch[1];
      const body = await readBody(req);
      if (!body?.status) return sendJson(res, 400, { error: "Expected { status }" });
      await db.collection("pickupRequests").updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: body.status, updatedAt: new Date() } },
      );
      return sendJson(res, 200, { ok: true });
    }

    // ── POST /api/chat ────────────────────────────────────────────
    if (pathname === "/api/chat" && req.method === "POST") {
      if (!genAI) return sendJson(res, 503, { error: "GEMINI_API_KEY is not set" });
      const body = await readBody(req);
      if (!body?.message) return sendJson(res, 400, { error: "Expected { message }" });

      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Build history for multi-turn
      const history = (body.history ?? []).map((turn) => ({
        role: turn.role === "assistant" ? "model" : "user",
        parts: [{ text: turn.text }],
      }));

      const chat = model.startChat({
        history: [
          { role: "user", parts: [{ text: CHAT_SYSTEM }] },
          { role: "model", parts: [{ text: "Understood. I'm ready to help donors with Goodwill DC donation questions." }] },
          ...history,
        ],
      });

      // Build message parts — text + optional image
      const parts = [{ text: body.message }];
      if (body.image) {
        // image is a base64 data URL: "data:image/jpeg;base64,..."
        const match = body.image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) {
          parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
        }
      }

      const result = await chat.sendMessage(parts);
      const reply = result.response.text();
      return sendJson(res, 200, { reply });
    }

    res.writeHead(404);
    res.end("Not found");
  } catch (err) {
    console.error(err);
    return sendJson(res, 500, { error: err instanceof Error ? err.message : "Server error" });
  }
});

server.listen(PORT, () => {
  if (!URI) console.warn("[gooddrop-api] MONGODB_URI is not set — all routes return 503.");
  console.log(`[gooddrop-api] http://127.0.0.1:${PORT}`);
});
