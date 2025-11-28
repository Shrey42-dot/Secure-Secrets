// backend/routes/secret.js
import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/backcrypto.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import rateLimit from "express-rate-limit";

const router = express.Router();

// --- RATELIMITERS ---
const createSecretLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_secrets" },
});

const viewSecretLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

const pdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_pdf_requests" },
});

// --- HELPER: TEXT SANITIZATION ---
function sanitizeForPDF(str) {
  if (!str) return "";
  return str
    .replace(/[^\x20-\x7E\n\r\t]/g, "?") 
    .replace(/\t/g, "    ")              
    .replace(/\r/g, "")                  
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") 
    .replace(/\\/g, "\\\\");             
}

// --- HELPER: MANUAL WORD WRAP (Fixes the crash) ---
function wordWrap(text, font, fontSize, maxWidth) {
  const lines = [];
  // 1. Split by existing newlines first
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      // Measure width of (currentLine + space + word)
      const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word; // Start new line with current word
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

// --- HELPER: MULTILINE TEXT DRAWING ---
async function drawMultilineText(pdfDoc, text, font, fontSize, maxWidth, startX, startY, lineHeight = 18) {
  const pages = [];
  let page = pdfDoc.addPage([600, 800]);
  pages.push(page);

  let y = startY;

  // Use the manual wordWrap helper
  const wrappedLines = wordWrap(text, font, fontSize, maxWidth);

  for (const line of wrappedLines) {
    if (y < 50) {
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
    const { text, images, password } = req.body;

    if (text && text.length > 50000) {
      return res.status(413).json({ error: "text_too_large" });
    }

    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.length > 15000000) { 
           return res.status(413).json({ error: "image_too_large" });
        }
      }
    }

    if (!text && (!images || images.length === 0)) {
      return res.status(400).send("Missing PDF content");
    }

    const pdfDoc = await PDFDocument.create();

    if (password) {
      pdfDoc.encrypt({
        ownerPassword: password,
        userPassword: password,
      });
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 14;
    const safeText = sanitizeForPDF(text || " ");

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
      if (!images || images.length === 0) pdfDoc.addPage([600, 800]);
    }

    if (images && Array.isArray(images) && images.length > 0) {
      for (const imgBase64 of images) {
        if (!imgBase64) continue;
        try {
          const imgBytes = Buffer.from(imgBase64, "base64");
          let embedded;

          if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) {
            embedded = await pdfDoc.embedJpg(imgBytes);
          } else if (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) {
            embedded = await pdfDoc.embedPng(imgBytes);
          } else {
            console.log("Skipping invalid image format");
            continue; 
          }

          const { width, height } = embedded.scale(1);
          const maxWidth = 500;
          const scale = width > maxWidth ? maxWidth / width : 1;
          const newWidth = width * scale;
          const newHeight = height * scale;

          const imgPage = pdfDoc.addPage([600, 800]);
          imgPage.drawImage(embedded, {
            x: 50,
            y: 800 - newHeight - 50,
            width: newWidth,
            height: newHeight
          });

        } catch (imgErr) {
          console.error("Failed to embed an image:", imgErr);
        }
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="secret.pdf"');
    res.send(Buffer.from(pdfBytes));

  } catch (err) {
    console.error("CRITICAL PDF GENERATION ERROR:", err);
    res.status(500).send("PDF generation failed");
  }
});

export default router;