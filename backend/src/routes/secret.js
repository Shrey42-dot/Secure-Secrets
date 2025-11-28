// backend/routes/secret.js
import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/backcrypto.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// --- RATELIMITERS ---
const createSecretLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_secrets" },
});

const viewSecretLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

// --- ROUTE: CREATE SECRET ---
router.post("/", createSecretLimiter, async (req, res) => {
  try {
    const { secret, password_protected } = req.body;
    const ttl_seconds = req.body.ttl_seconds || 3600;

    if (!secret || typeof secret !== "string") {
      return res.status(400).json({ error: "Missing encrypted secret" });
    }

    const token = genToken();
    const tokenHash = hashToken(token);

    await Secret.create({
      token_hash: tokenHash,
      ciphertext: secret,
      password_protected: password_protected || false,
      expires_at: new Date(Date.now() + ttl_seconds * 1000)
    });

    return res.status(201).json({ token });

  } catch (err) {
    console.error("POST / error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

// --- ROUTE: VIEW SECRET ---
router.get("/:token", viewSecretLimiter, async (req, res) => {
  try {
    const tokenHash = hashToken(req.params.token);

    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    if (!doc) return res.status(410).json({ error: "gone_or_invalid" });

    return res.json({
      encrypted: doc.ciphertext,
      expires_at: doc.expires_at,
      password_protected: doc.password_protected
    });

  } catch (err) {
    console.error("GET / error", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;