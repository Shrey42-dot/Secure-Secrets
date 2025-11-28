// backend/routes/secret.js
import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/backcrypto.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
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

const pdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_pdf_requests" },
});

// --- HELPER: TEXT SANITIZATION ---
// Prevents PDF crash by removing characters not supported by StandardFonts (Helvetica)
function sanitizeForPDF(str) {
  if (!str) return "";
  return str
    // Replace characters outside basic ASCII printable range with "?"
    // (Standard PDF fonts do not support Emojis or Unicode without complex font files)
    .replace(/[^\x20-\x7E\n\r\t]/g, "?") 
    .replace(/\t/g, "    ")              
    .replace(/\r/g, "")                  
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") 
    .replace(/\\/g, "\\\\");             
}

// --- HELPER: MULTILINE TEXT DRAWING ---
async function drawMultilineText(pdfDoc, text, font, fontSize, maxWidth, startX, startY, lineHeight = 18) {
  const pages = [];
  let page = pdfDoc.addPage([600, 800]);
  pages.push(page);

  let y = startY;

  // Split text into lines that fit the width
  const wrapped = font.splitTextIntoLines(text, maxWidth);

  for (const line of wrapped) {
    if (y < 50) {
      // Add new page if we run out of vertical space
      page = pdfDoc.addPage([600, 800]);
      pages.push(page);
      y = 750; 
    }

    page.drawText(line, {
      x: startX,
      y,
      size: fontSize,
      font,
    });

    y -= lineHeight;
  }
  return pages;
}

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

// --- ROUTE: DOWNLOAD PDF ---
router.post("/:token/pdf", pdfLimiter, async (req, res) => {
  try {
    // 1. Correctly destructure 'images' (plural) from request body
    const { text, images, password } = req.body;

    // 2. Validate Text Size
    if (text && text.length > 50000) {
      return res.status(413).json({ error: "text_too_large" });
    }

    // 3. Validate Images Size (Loop through array)
    if (images && Array.isArray(images)) {
      for (const img of images) {
        // Check if individual image > ~14MB Base64 (approx 10MB binary)
        if (img.length > 15000000) { 
           return res.status(413).json({ error: "image_too_large" });
        }
      }
    }

    // 4. Validate Content Existence
    if (!text && (!images || images.length === 0)) {
      return res.status(400).send("Missing PDF content");
    }

    // --- PDF GENERATION START ---
    const pdfDoc = await PDFDocument.create();

    // Encrypt PDF if password provided
    if (password) {
      pdfDoc.encrypt({
        ownerPassword: password,
        userPassword: password,
      });
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 14;

    // Sanitize text to prevent crashes from unsupported characters
    const safeText = sanitizeForPDF(text || " ");

    // Draw Text
    if (text && text.trim().length > 0) {
      await drawMultilineText(
        pdfDoc,
        safeText,
        font,
        fontSize,
        500,   
        50,    
        750    
      );
    } else {
      // Ensure at least one page exists if only images are present
      if (!images || images.length === 0) pdfDoc.addPage([600, 800]);
    }

    // Draw Images
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imgBase64 of images) {
        if (!imgBase64) continue;

        try {
          const imgBytes = Buffer.from(imgBase64, "base64");
          let embedded;

          // Check Magic Bytes to identify JPG vs PNG
          if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) {
            embedded = await pdfDoc.embedJpg(imgBytes);
          } else if (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) {
            embedded = await pdfDoc.embedPng(imgBytes);
          } else {
            console.log("Skipping invalid image format");
            continue; 
          }

          const { width, height } = embedded.scale(1);
          
          // Scale down if image is too wide for PDF page (max 500px)
          const maxWidth = 500;
          const scale = width > maxWidth ? maxWidth / width : 1;

          const newWidth = width * scale;
          const newHeight = height * scale;

          // Add new page for each image
          const imgPage = pdfDoc.addPage([600, 800]);
          imgPage.drawImage(embedded, {
            x: 50,
            y: 800 - newHeight - 50,
            width: newWidth,
            height: newHeight
          });

        } catch (imgErr) {
          console.error("Failed to embed an image:", imgErr);
          // Do not crash the whole process for one bad image
        }
      }
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="secret.pdf"');
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    // --- IMPORTANT: Log the actual error to Render Console ---
    console.error("CRITICAL PDF GENERATION ERROR:", err);
    res.status(500).send("PDF generation failed");
  }
});

export default router;