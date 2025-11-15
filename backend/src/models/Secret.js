// src/models/Secret.js
import mongoose from "mongoose";

const SecretSchema = new mongoose.Schema({
  token_hash: { type: String, required: true, unique: true },
  ciphertext: { type: String, required: true },
  iv: { type: String, required: true },
  tag: { type: String, required: true },
  algorithm: { type: String, default: "AES-256-GCM" },
  created_at: { type: Date, default: Date.now },
  expires_at: { type: Date, required: true }
});

// TTL index to automatically remove expired documents
SecretSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Secret = mongoose.model("Secret", SecretSchema);
export default Secret;
