import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/crypto.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { secret, ttl_seconds = 3600 } = req.body;

    // The frontend always sends an encrypted string
    if (!secret || typeof secret !== "string") {
      return res
        .status(400)
        .json({ error: "Missing or invalid encrypted secret" });
    }

    const token = genToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + ttl_seconds * 1000);

    // Store encrypted string directly
    await Secret.create({
      token_hash: tokenHash,
      ciphertext: secret,
      expires_at: expiresAt,
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error("create error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const tokenHash = hashToken(token);

    // Atomically fetch + delete
    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    if (!doc)
      return res.status(410).json({ error: "gone_or_invalid" });

    res.set("Cache-Control", "no-store");

    // Return encrypted blob
    return res.json({
      encrypted: doc.ciphertext,
    });
  } catch (err) {
    console.error("retrieve error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
