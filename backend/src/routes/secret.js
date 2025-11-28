import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/backcrypto.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Max 30 secret creations per IP per hour
const createSecretLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_secrets" },
});

// Max 30 secret views per IP per 10 minutes
const viewSecretLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_requests" },
});

// Max 10 PDF generations per IP per 10 minutes
const pdfLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "too_many_pdf_requests" },
});

// Utility: Draw multi-page long text safely
async function drawMultilineText(pdfDoc, text, font, fontSize, maxWidth, startX, startY, lineHeight = 18) {
  const pages = [];
  let page = pdfDoc.addPage([600, 800]);
  pages.push(page);

  let y = startY;

  // split into wrapped lines
  const wrapped = font.splitTextIntoLines(text, maxWidth);

  for (const line of wrapped) {
    if (y < 50) {
      // create new page when out of space
      page = pdfDoc.addPage([600, 800]);
      pages.push(page);
      y = 750; // reset y position
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
    console.error("POST / error");
    return res.status(500).json({ error: "internal_error" });
  }
});


router.get("/:token", viewSecretLimiter, async (req, res) => {
  try {
    const tokenHash = hashToken(req.params.token);

    const doc = await Secret.findOneAndDelete({ token_hash: tokenHash });
    if (!doc) return res.status(410).json({ error: "gone_or_invalid" });

    // return encrypted only
    return res.json({
      encrypted: doc.ciphertext,
      expires_at: doc.expires_at,
      password_protected: doc.password_protected
    })

  } catch (err) {
    console.error("GET / error");
    res.status(500).json({ error: "internal_error" });
  }
});

function sanitizeForPDF(str) {
  if (!str) return "";

  return str
    .replace(/\t/g, "    ")              // replace tabs with spaces
    .replace(/\r/g, "")                  // remove carriage returns
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "") // remove control chars
    .replace(/\\/g, "\\\\");              // escape backslashes
}


router.post("/:token/pdf", pdfLimiter, async (req, res) => {
  try {
    //Destructure 'images' (plural), not 'image'
    const { text, images, password } = req.body;

    // Prevent huge PDF payloads
    if (text && text.length > 1000000) {
       // Increased text limit slightly just in case
      return res.status(413).json({ error: "text_too_large" });
    }

    // 2. FIX: Check size of images inside the array (10MB limit per image)
    // 10MB = 10 * 1024 * 1024 = 10485760
    if (images && Array.isArray(images)) {
      for (const img of images) {
        if (img.length > 10485760 * 1.37) { 
           // Base64 is ~37% larger than binary. 10MB binary ~= 14MB Base64.
           // Safe buffer: 15,000,000 chars
           return res.status(413).json({ error: "image_too_large" });
        }
      }
    }

    // 3. FIX: Check 'images' array length for content validation
    if (!text && (!images || images.length === 0)) {
      return res.status(400).send("Missing PDF content");
    }

    const pdfDoc = await PDFDocument.create();

    // Encryption must happen BEFORE adding pages
    if (password) {
      pdfDoc.encrypt({
        ownerPassword: password,
        userPassword: password,
      });
    }

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 14;

    const safeText = sanitizeForPDF(text || " ");

    // Draw text only if it exists
    if (text) {
      await drawMultilineText(
        pdfDoc,
        safeText,
        font,
        fontSize,
        500,   // max width
        50,    // x
        750    // y start
      );
    } else {
      // If no text, add a blank page to start so we can add images
      // (Unless drawMultilineText handles empty strings by adding a page, 
      // but usually it's safer to ensure at least one page exists if we have only images)
      if (!images || images.length === 0) pdfDoc.addPage([600, 800]);
    }

    // MULTI-IMAGE PDF
    // 4. FIX: The variable 'images' is now correctly defined from req.body
    if (images && Array.isArray(images) && images.length > 0) {
      for (const imgBase64 of images) {
        // Safety check for empty strings
        if (!imgBase64) continue;

        const imgBytes = Buffer.from(imgBase64, "base64");

        let embedded;
        try {
          if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) {
            embedded = await pdfDoc.embedJpg(imgBytes);
          } else if (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) {
            embedded = await pdfDoc.embedPng(imgBytes);
          } else {
            continue; // skip invalid image types
          }
        } catch (e) {
          console.error("Error embedding image:", e);
          continue; 
        }

        const { width, height } = embedded.scale(1);

        // fit width to 500px max
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
      }
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="secret.pdf"'
    );

    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("PDF generation failed:", err);
    res.status(500).send("PDF generation failed");
  }
});


export default router;
