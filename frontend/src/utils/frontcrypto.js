// src/utils/crypto.js
// 🛡️ Client-side AES-GCM Encryption with PBKDF2 (Zero Knowledge)

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const MASTER_KEY_BASE64 = import.meta.env.VITE_MASTER_KEY_BASE64;
const MASTER_KEY_BYTES = Uint8Array.from(atob(MASTER_KEY_BASE64), c => c.charCodeAt(0));
const masterKeyPromise = getSubtle().importKey(
  "raw",
  MASTER_KEY_BYTES,
  "AES-GCM",
  false,
  ["encrypt", "decrypt"]
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
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
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
    "raw", textEncoder.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  
  // 3. Derive Key (600k iterations = High Security)
  const aesKey = await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // 4. Encrypt
  const encryptedContent = await subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    textEncoder.encode(plaintext)
  );

  // 5. Pack: Salt + IV + Ciphertext
  const combined = new Uint8Array(
    salt.byteLength + iv.byteLength + encryptedContent.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.byteLength);
  combined.set(new Uint8Array(encryptedContent), salt.byteLength + iv.byteLength);

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

  // 1. Unpack
  const combined = base64ToBytes(packedData);
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  // 2. Import Password
  const baseKey = await subtle.importKey(
    "raw", textEncoder.encode(password), "PBKDF2", false, ["deriveKey"]
  );

  // 3. Re-Derive Key
  const aesKey = await subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  // 4. Decrypt
  try {
    const decrypted = await subtle.decrypt(
        { name: "AES-GCM", iv },
        aesKey,
        ciphertext
    );
    return textDecoder.decode(decrypted);
  } catch (e) {
      console.error(e);
      throw new Error("Decryption failed. Wrong password?");
  }
}
export async function encryptWithMasterKey(plaintext) {
  const encodedPlaintext = textEncoder.encode(plaintext);
  const masterKey = await masterKeyPromise;
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    masterKey,
    encodedPlaintext
  )
  const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);


  return bytesToBase64(combined);

}
export async function decryptWithMasterKey(packedData) {
  const combined = base64ToBytes(packedData);
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const masterKey = await masterKeyPromise;
  const decryptedbuffer = await crypto.subtle.decrypt(
  { name: "AES-GCM", iv },
  masterKey,
  ciphertext
)
const plaintext = textDecoder.decode(decryptedbuffer);
return plaintext
}