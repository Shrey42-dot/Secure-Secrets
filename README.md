# 🔒 Secure Secrets
### Zero-Knowledge, End-to-End Encrypted Secret Sharing

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-339933)
![Encryption](https://img.shields.io/badge/Security-AES--GCM%20256-red)

**Secure Secrets** is a modern, privacy-first application that allows users to share sensitive text and images securely. Unlike traditional sharing tools, this application employs a **Zero-Knowledge Architecture**, meaning the encryption happens entirely in your browser. The server **never** sees the unencrypted data, the encryption keys, or the original files.

[**🔴 Live Demo**]
(https://secure-secrets.vercel.app/)

---

## 📸 Screenshots

| **Create Secret (Dark Mode)** | **Decrypted View (Dark Mode)** |
|:---:|:---:|
| <img width="1920" height="1036" alt="Screenshot 2025-11-29 205307" src="https://github.com/user-attachments/assets/ac94a1b8-6aa6-4c6e-af71-01e13808d6e0" /> | <img width="1920" height="1036" alt="Screenshot 2025-11-29 205750" src="https://github.com/user-attachments/assets/915328c2-975b-40ff-a7a2-d062d2196dfa" />|

---

## ✨ Key Features

* **🛡️ True Zero-Knowledge Encryption:** Data is encrypted on the client-side using **AES-GCM** before it ever touches the network. The server only receives encrypted blobs.
* **🔥 Burn-on-Read:** Secrets are permanently deleted from the database immediately after they are retrieved. Once a tab is closed, the data is gone forever.
* **🖼️ Secure Image Sharing:** Supports sharing up to 20 images (10MB each) with automatic **EXIF Metadata Stripping** to protect user anonymity (location/device data removal).
* **📄 Client-Side PDF Export:** Users can download their secrets as a PDF. This generation happens 100% in the browser using `pdf-lib`, ensuring the unencrypted secret never leaves the user's device.
* **🔐 Password Protection:** Optional PBKDF2 layer for deriving encryption keys from a user-provided password.
* **🎨 Modern UI/UX:** Built with Tailwind CSS using a premium "Slate & Indigo" dark mode aesthetic with smooth transitions and animations.

---

## 🏗️ Architecture & Security

### How the "Zero-Knowledge" System Works
1.  **Encryption:** When a user clicks "Create Link", the browser generates a symmetric key. The text and images are packed into a JSON object and encrypted using **AES-GCM (256-bit)** via the Web Crypto API.
2.  **Transmission:** Only the `ciphertext` (encrypted gibberish) is sent to the backend (MongoDB). The encryption key is appended to the URL fragment (`#...`) which is **never sent to the server**.
3.  **Decryption:** When the recipient opens the link, the browser extracts the key from the URL fragment, fetches the `ciphertext` from the server, and decrypts it locally.

### Security Measures implemented
* **Strict CORS:** API blocks all origins except the frontend domain.
* **Helmet Headers:** Enforces strict HTTP headers to prevent XSS and sniffing.
* **Rate Limiting:** IP-based limiting on creation (30/hr) and viewing (30/10min) to prevent brute-force attacks.
* **Metadata Scrubbing:** All uploaded images are processed via HTML5 Canvas to strip hidden metadata before encryption.

---

## 🛠️ Tech Stack

### Frontend
* **Framework:** React 18 (Vite)
* **Styling:** Tailwind CSS (Custom Slate/Indigo Theme)
* **Cryptography:** Web Crypto API (Native Browser Standard)
* **PDF Engine:** `pdf-lib` (Client-side generation)
* **Routing:** React Router DOM

### Backend
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (Mongoose)
* **Security:** `helmet`, `cors`, `express-rate-limit`

---

## 🚀 Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
    git clone [https://github.com/Shrey42-dot/Secure-Secrets.git](https://github.com/Shrey42-dot/Secure-Secrets.git)
    cd Secure-Secrets

### 2. Backend Setup
Firstly 
* Create a .env file in /backend
* PORT=4000
* MONGO_URI=your_mongodb_connection_string
* FRONTEND_URL=http://localhost:5173
  
Then only run this in the terminal

      cd backend
      npm install
      npm run dev

### 3. Frontend Setup 
Firstly 
* Create a .env file in /frontend
* VITE_API_URL=http://localhost:4000
* VITE_MASTER_KEY_BASE64=your_generated_32byte_key
  
Then only run this in the terminal

      cd frontend
      npm install
      npm run dev

---

## 📂 Project Structure

The Project Structure of the project is 

      SECURE-SECRETS/
      ├── backend/
      │   ├── src/
      │   │   ├── lib/          # Backend crypto utilities
      │   │   ├── models/       # Mongoose Schemas (TTL Indexing)
      │   │   └── routes/       # Express Routes (Rate limited)
      │   └── index.js          # Entry point (Helmet/CORS config)
      ├── frontend/
      │   ├── src/
      │   │   ├── Components/   # UI Components (DragDrop, PasswordSection)
      │   │   ├── hooks/        # Logic extraction (useCreateSecret, useViewSecret)
      │   │   ├── utils/        # Client-side Crypto & File handling
      │   │   └── pages/        # Main Views
      └── README.md

---

## ⚠️ Disclaimer

This tool is designed for privacy and security. While we use industry-standard encryption (AES-GCM), users are responsible for the content they share. We do not (and cannot) moderate content due to the Zero-Knowledge architecture.

---
<p align="center"> Made with ❤️ by <a href="https://www.google.com/search?q=https://github.com/Shrey42-dot">Shrey</a> </p>
