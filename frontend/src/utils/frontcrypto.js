// src/utils/crypto.js
// 🛡️ Client-side AES-GCM Encryption with PBKDF2 (Zero Knowledge)

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const MASTER_KEY_BASE64 = import.meta.env.VITE_MASTER_KEY_BASE64;
const MASTER_KEY_BYTES = Uint8Array.from(atob(MASTER_KEY_BASE64), (c) =>
	c.charCodeAt(0),
);
const masterKeyPromise = getSubtle().importKey(
	"raw",
	MASTER_KEY_BYTES,
	"AES-GCM",
	false,
	["encrypt", "decrypt"],
);

/**
 * Checks if Web Crypto is supported.
 */
function getSubtle() {
	if (window.crypto?.subtle) return window.crypto.subtle;
	throw new Error("WebCrypto not supported in this browser.");
}

/**
 * Helper: Convert Uint8Array to Base64 string
 */
function bytesToBase64(bytes) {
	let binary = "";
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

/**
 * Helper: Convert Base64 string to Uint8Array
 */
/**
 * Helper: Safely convert Base64 string to Uint8Array
 * Returns null if the string is not valid Base64.
 */
function safeBase64ToBytes(base64) {
	if (typeof base64 !== "string" || !base64.trim()) {
		return null;
	}

	try {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	} catch (e) {
		// atob() threw -> invalid Base64
		return null;
	}
}

/**
 * 🔐 Encrypts text using a password.
 * Returns a single Base64 string containing [Salt + IV + Ciphertext]
 * * @param {string} password - User's password
 * @param {string} plaintext - Data to encrypt
 * @returns {Promise<string>} Base64 packed string
 */
export async function encryptWithPassword(password, plaintext) {
	const subtle = getSubtle();

	// 1. Generate Salt (16 bytes) and IV (12 bytes)
	const salt = window.crypto.getRandomValues(new Uint8Array(16));
	const iv = window.crypto.getRandomValues(new Uint8Array(12));

	// 2. Import Password
	const baseKey = await subtle.importKey(
		"raw",
		textEncoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	// 3. Derive Key (600k iterations = High Security)
	const aesKey = await subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);

	// 4. Encrypt
	const encryptedContent = await subtle.encrypt(
		{ name: "AES-GCM", iv },
		aesKey,
		textEncoder.encode(plaintext),
	);

	// 5. Pack: Salt + IV + Ciphertext
	const combined = new Uint8Array(
		salt.byteLength + iv.byteLength + encryptedContent.byteLength,
	);
	combined.set(salt, 0);
	combined.set(iv, salt.byteLength);
	combined.set(
		new Uint8Array(encryptedContent),
		salt.byteLength + iv.byteLength,
	);

	return bytesToBase64(combined);
}
export async function encryptWithMasterKey(plaintext) {
	const encodedPlaintext = textEncoder.encode(plaintext);
	const masterKey = await masterKeyPromise;
	const iv = window.crypto.getRandomValues(new Uint8Array(12));
	const ciphertextBuffer = await crypto.subtle.encrypt(
		{ name: "AES-GCM", iv },
		masterKey,
		encodedPlaintext,
	);
	const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
	combined.set(iv, 0);
	combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);

	return bytesToBase64(combined);
}
/**
 * 🔓 Decrypts data using a password.
 * * @param {string} password - User's password
 * @param {string} packedData - The Base64 string from encryptWithPassword
 * @returns {Promise<string>} Decrypted text
 */
export async function decryptWithPassword(password, packedData) {
	const subtle = getSubtle();

	// 0. Basic sanity checks
	if (!password || typeof password !== "string") {
		throw new Error("Missing password.");
	}

	const combined = safeBase64ToBytes(packedData);
	if (!combined) {
		// Invalid or tampered base64
		throw new Error("Invalid or corrupted secret.");
	}

	// Expected layout: [16 bytes salt][12 bytes IV][ciphertext+tag]
	if (combined.length < 16 + 12 + 16) {
		// 16 bytes minimum for GCM tag
		throw new Error("Invalid or corrupted secret.");
	}

	const salt = combined.slice(0, 16);
	const iv = combined.slice(16, 28);
	const ciphertext = combined.slice(28);

	// 2. Import Password
	const baseKey = await subtle.importKey(
		"raw",
		textEncoder.encode(password),
		"PBKDF2",
		false,
		["deriveKey"],
	);

	// 3. Re-Derive Key
	const aesKey = await subtle.deriveKey(
		{ name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
		baseKey,
		{ name: "AES-GCM", length: 256 },
		false,
		["encrypt", "decrypt"],
	);

	// 4. Decrypt
	try {
		const decrypted = await subtle.decrypt(
			{ name: "AES-GCM", iv },
			aesKey,
			ciphertext,
		);
		return textDecoder.decode(decrypted);
	} catch (e) {
		// Don't leak internal error – just say it's wrong / corrupted
		throw new Error("Incorrect password or corrupted data.");
	}
}

export async function decryptWithMasterKey(packedData) {
	const combined = safeBase64ToBytes(packedData);
	if (!combined) {
		throw new Error("Invalid or corrupted secret.");
	}

	// Layout: [12 bytes IV][ciphertext+tag]
	if (combined.length < 12 + 16) {
		throw new Error("Invalid or corrupted secret.");
	}

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);

	const masterKey = await masterKeyPromise;

	try {
		const decryptedBuffer = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv },
			masterKey,
			ciphertext,
		);
		return textDecoder.decode(decryptedBuffer);
	} catch (e) {
		throw new Error("Invalid or corrupted secret.");
	}
}
