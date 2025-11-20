import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/crypto.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { secret } = req.body;
    const ttl_seconds = req.body.ttl_seconds || 3600;

    if (!secret || typeof secret !== "string") {
      return res.status(400).json({ error: "Missing encrypted secret" });
    }

    const token = genToken();
    const tokenHash = hashToken(token);

    await Secret.create({
      token_hash: tokenHash,
      ciphertext: secret,
      expires_at: new Date(Date.now() + ttl_seconds * 1000)
    });

    return res.status(201).json({ token });

  } catch (err) {
    console.error("POST / error:", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

router.get("/:token", async (req, res) => {
  try {
    const tokenHash = hashToken(req.params.token);

    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    if (!doc) return res.status(410).json({ error: "gone_or_invalid" });

    // return encrypted only
    return res.json({
      encrypted: doc.ciphertext,
      expires_at: doc.expires_at })

  } catch (err) {
    console.error("GET / error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
