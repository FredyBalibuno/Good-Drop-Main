import { MongoClient, ObjectId } from "mongodb";
import { OAuth2Client } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "gooddrop";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const elevenlabs = ELEVENLABS_API_KEY ? new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY }) : null;

const CHAT_SYSTEM = `You are a donation assistant for Goodwill of Greater Washington (DC Goodwill).
Your ONLY purpose is to help donors understand what Goodwill will and will not accept.
Do NOT answer questions unrelated to Goodwill donation guidelines.
If asked anything off-topic, politely redirect back to donation questions.

DC GOODWILL ACCEPTANCE RULES:

CLOTHING — ACCEPT if: clean, no stains, no holes/rips/tears, no pet hair, no mildew/odor, wearable condition.
CLOTHING — REJECT if: any visible stains, holes or tears, excessive pet hair, mildew smell, extreme fading.

ELECTRONICS — ACCEPT: flat-screen TVs, small appliances, computers in ANY condition, gaming consoles, radios/stereos, lamps, fans, software under 2 years old.
ELECTRONICS — REJECT: CRT/tube TVs, large appliances (fridges, stoves, washers, dryers, dishwashers), visibly broken with no repair potential.

FURNITURE — ACCEPT if: clean, under ~50 lbs, no rips/stains/pet hair, structurally intact, all parts present.
FURNITURE — REJECT if: stained/mildewed/rusty, missing parts, broken, covered in pet hair, torn upholstery, over 50 lbs.

BOOKS & MEDIA — ACCEPT: books in readable condition, textbooks, CDs/DVDs/Blu-rays in cases, vinyl records, video games.
BOOKS & MEDIA — REJECT: water-damaged or moldy books, pages falling out, very outdated software (5+ years).

HOUSEWARES — ACCEPT: kitchenware, dishes, glasses, cookware in good condition, home decor, clean functional items.
HOUSEWARES — REJECT: broken items, major chips/cracks, opened cosmetics/personal care, food/beverages.

TOYS & SPORTS — ACCEPT: toys in good condition, stuffed animals, complete games/puzzles, sporting equipment under 50 lbs.
TOYS & SPORTS — REJECT: broken toys with sharp edges, games with missing pieces, exercise equipment over 50 lbs.

NEVER ACCEPTED: Mattresses, cribs, strollers, car seats, large appliances, paint, chemicals, firearms, CRT TVs, medical equipment, tires.

When an item is rejected, always suggest an alternative disposal option.
Be warm, practical, and concise — 2-3 sentences max per response.`;

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

let client = null;

async function getDb() {
  if (!URI) return null;
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  return client.db(DB_NAME);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
  return JSON.parse(raw);
}

export default async function handler(req, res) {
  const origin = req.headers.origin ?? "*";
  res.setHeader("Access-Control-Allow-Origin", process.env.CORS_ORIGIN ?? origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  const pathname = req.url.replace(/\?.*$/, "");

  try {
    const db = await getDb();
    if (!db) { res.status(503).json({ error: "MONGODB_URI is not set" }); return; }

    // POST /api/auth/google
    if (pathname === "/api/auth/google" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.credential) { res.status(400).json({ error: "Missing credential" }); return; }
      const ticket = await googleClient.verifyIdToken({ idToken: body.credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.sub) { res.status(401).json({ error: "Invalid token" }); return; }
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
      await db.collection("users").updateOne({ _id: payload.sub }, { $set: { ...user, updatedAt: new Date() } }, { upsert: true });
      const { _id, ...rest } = user;
      res.status(200).json({ id: _id, ...rest });
      return;
    }

    // GET /api/users/:id
    const userMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (userMatch && req.method === "GET") {
      const userId = userMatch[1];
      const user = await db.collection("users").findOne({ _id: userId });
      if (!user) { res.status(404).json({ error: "User not found" }); return; }
      const submissions = await db.collection("submissions").find({ userId }).sort({ createdAt: -1 }).toArray();
      const { _id, ...rest } = user;
      res.status(200).json({ ...rest, id: _id, submissions: submissions.map(({ _id: sid, ...s }) => s) });
      return;
    }

    // PUT /api/users/:id/rating
    const ratingMatch = pathname.match(/^\/api\/users\/([^/]+)\/rating$/);
    if (ratingMatch && req.method === "PUT") {
      const userId = ratingMatch[1];
      const body = await readBody(req);
      if (typeof body?.rating !== "number") { res.status(400).json({ error: "Expected { rating: number }" }); return; }
      const rating = Math.min(5, Math.max(0, body.rating));
      const pickupUnlocked = rating >= 4.0;
      await db.collection("users").updateOne({ _id: userId }, { $set: { rating, pickupUnlocked, updatedAt: new Date() } });
      res.status(200).json({ ok: true, rating, pickupUnlocked });
      return;
    }

    // GET /api/users
    if (pathname === "/api/users" && req.method === "GET") {
      const users = await db.collection("users").find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(users.map(({ _id, ...u }) => ({ id: _id, ...u })));
      return;
    }

    // GET /api/demand
    if (pathname === "/api/demand" && req.method === "GET") {
      const doc = await db.collection("demand").findOne({ _id: "singleton" });
      res.status(200).json(doc ?? DEFAULT_DEMAND);
      return;
    }

    // PUT /api/demand
    if (pathname === "/api/demand" && req.method === "PUT") {
      const body = await readBody(req);
      if (!body) { res.status(400).json({ error: "Expected JSON body" }); return; }
      await db.collection("demand").updateOne({ _id: "singleton" }, { $set: { ...body, updatedAt: new Date() } }, { upsert: true });
      res.status(200).json({ ok: true });
      return;
    }

    // GET /api/submissions
    if (pathname === "/api/submissions" && req.method === "GET") {
      const docs = await db.collection("submissions").find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(docs.map(({ _id, ...rest }) => rest));
      return;
    }

    // POST /api/submissions
    if (pathname === "/api/submissions" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.id) { res.status(400).json({ error: "Expected submission with id" }); return; }
      await db.collection("submissions").updateOne({ _id: body.id }, { $set: { ...body, updatedAt: new Date() } }, { upsert: true });
      res.status(201).json({ ok: true });
      return;
    }

    // DELETE /api/submissions
    if (pathname === "/api/submissions" && req.method === "DELETE") {
      await db.collection("submissions").deleteMany({});
      res.status(200).json({ ok: true });
      return;
    }

    // GET /api/pickup-requests
    if (pathname === "/api/pickup-requests" && req.method === "GET") {
      const docs = await db.collection("pickupRequests").find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(docs.map(({ _id, ...rest }) => ({ id: _id.toString(), ...rest })));
      return;
    }

    // POST /api/pickup-requests
    if (pathname === "/api/pickup-requests" && req.method === "POST") {
      const body = await readBody(req);
      if (!body?.userId || !body?.address) { res.status(400).json({ error: "Missing required fields" }); return; }
      const doc = { ...body, status: "pending", createdAt: new Date().toISOString() };
      const result = await db.collection("pickupRequests").insertOne(doc);
      res.status(201).json({ ok: true, id: result.insertedId.toString() });
      return;
    }

    // PATCH /api/pickup-requests/:id
    const pickupMatch = pathname.match(/^\/api\/pickup-requests\/([^/]+)$/);
    if (pickupMatch && req.method === "PATCH") {
      const id = pickupMatch[1];
      const body = await readBody(req);
      if (!body?.status) { res.status(400).json({ error: "Expected { status }" }); return; }
      await db.collection("pickupRequests").updateOne({ _id: new ObjectId(id) }, { $set: { status: body.status, updatedAt: new Date() } });
      res.status(200).json({ ok: true });
      return;
    }

    // POST /api/chat
    if (pathname === "/api/chat" && req.method === "POST") {
      if (!genAI) { res.status(503).json({ error: "GEMINI_API_KEY is not set" }); return; }
      const body = await readBody(req);
      if (!body?.message) { res.status(400).json({ error: "Expected { message }" }); return; }
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      const parts = [{ text: body.message }];
      if (body.image) {
        const match = body.image.match(/^data:(image\/\w+);base64,(.+)$/);
        if (match) parts.push({ inlineData: { mimeType: match[1], data: match[2] } });
      }
      const result = await chat.sendMessage(parts);
      res.status(200).json({ reply: result.response.text() });
      return;
    }

    // POST /api/tts
    if (pathname === "/api/tts" && req.method === "POST") {
      if (!elevenlabs) { res.status(503).json({ error: "ELEVENLABS_API_KEY is not set" }); return; }
      const body = await readBody(req);
      if (!body?.text) { res.status(400).json({ error: "Expected { text }" }); return; }
      const audioStream = await elevenlabs.textToSpeech.convert(
        body.voiceId ?? "JBFqnCBsd6RMkjVDRZzb",
        { text: body.text, model_id: "eleven_turbo_v2_5", output_format: "mp3_44100_128" },
      );
      res.setHeader("Content-Type", "audio/mpeg");
      for await (const chunk of audioStream) res.write(chunk);
      res.end();
      return;
    }

    res.status(404).end("Not found");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : "Server error" });
  }
}
