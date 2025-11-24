// src/utils/crypto.js
import CryptoJS from "crypto-js";

// PBKDF2 + AES encrypt, returns ciphertext + salt
export function encryptWithPassword(password, jsonString) {
  const salt = CryptoJS.lib.WordArray.random(16);

  const derivedKey = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const encrypted = CryptoJS.AES.encrypt(
    jsonString,
    derivedKey.toString()
  ).toString();

  return {
    encrypted,
    saltHex: salt.toString(), // hex for storage
  };
}

// PBKDF2 + AES decrypt, returns plaintext string (or "")
export function decryptWithPassword(password, ciphertext, saltHex) {
  const saltWA = CryptoJS.enc.Hex.parse(saltHex);

  const derivedKey = CryptoJS.PBKDF2(password, saltWA, {
    keySize: 256 / 32,
    iterations: 10000,
  });

  const bytes = CryptoJS.AES.decrypt(ciphertext, derivedKey.toString());
  return bytes.toString(CryptoJS.enc.Utf8);
}
