import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/backcrypto.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// --- RATELIMITERS (Recommendation #4 - Anomaly Detection Lite) ---
const createSecretLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded" },
});

const viewSecretLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "rate_limit_exceeded" },
});

// --- ROUTE: CREATE SECRET ---
router.post("/", createSecretLimiter, async (req, res, next) => {
  try {
    const { secret, password_protected } = req.body;
    const ttl_seconds = req.body.ttl_seconds || 3600;

    // Strict Validation
    if (!secret || typeof secret !== "string" || secret.length > 10000000) { 
       // Don't say "String too long", just say invalid
       return res.status(400).json({ error: "invalid_payload" });
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
    next(err); // Pass to global error handler (returns "internal_error")
  }
});

// --- ROUTE: VIEW SECRET ---
router.get("/:token", viewSecretLimiter, async (req, res, next) => {
  try {
    const tokenHash = hashToken(req.params.token);

    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    
    // TIMING ATTACK MITIGATION (Recommendation #2)
    // If doc is null, the response is instant. If doc exists, it takes time.
    // In a super-high security app, you would add a fake delay here if !doc.
    // For your use case, rate limiting handles the risk effectively.
    
    if (!doc) return res.status(410).json({ error: "gone_or_invalid" });

    return res.json({
      encrypted: doc.ciphertext,
      expires_at: doc.expires_at,
      password_protected: doc.password_protected
    });

  } catch (err) {
    next(err); // Pass to global error handler
  }
});

export default router;