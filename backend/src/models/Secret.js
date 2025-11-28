// src/models/Secret.js
import mongoose from "mongoose";

const SecretSchema = new mongoose.Schema({
	token_hash: { type: String, required: true, unique: true },

	// Encrypted string sent from the frontend (AES encrypted JSON)
	ciphertext: { type: String, required: true },

	password_protected: { type: Boolean, default: false },

	created_at: { type: Date, default: Date.now },

	// When this secret expires
	expires_at: { type: Date, required: true },
});

// TTL index to automatically remove expired documents
SecretSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const Secret = mongoose.model("Secret", SecretSchema);
export default Secret;
