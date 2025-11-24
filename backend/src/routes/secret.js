import express from "express";
import Secret from "../models/Secret.js";
import { genToken, hashToken } from "../lib/crypto.js";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { secret, password_protected, salt } = req.body;
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
      salt: salt || null,
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
      expires_at: doc.expires_at,
      password_protected: doc.password_protected,
      salt: doc.salt })

  } catch (err) {
    console.error("GET / error:", err);
    res.status(500).json({ error: "internal_error" });
  }
});


router.post("/:token/pdf", async (req, res) => {
  try {
    const { text, image, password } = req.body;

    if (!text && !image)
      return res.status(400).send("Missing PDF content");

    const pdfDoc = await PDFDocument.create();

    // FIX: Encryption must happen BEFORE adding pages or embedding images/fonts
    if (password) {
      pdfDoc.encrypt({
        ownerPassword: password,
        userPassword: password,
      });
    }

    const page = pdfDoc.addPage([600, 800]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 14;

    page.drawText(text || "No text provided", {
      x: 50,
      y: 750,
      size: fontSize,
      font,
      maxWidth: 500,
      color: rgb(0, 0, 0),
    });

    if (image) {
      const imgBytes = Buffer.from(image, "base64");

      let embedded;

      // Detect JPG via magic bytes FF D8
      if (imgBytes[0] === 0xFF && imgBytes[1] === 0xD8) {
        embedded = await pdfDoc.embedJpg(imgBytes);
      }
      // Detect PNG via magic bytes 89 50 4E 47
      else if (
        imgBytes[0] === 0x89 &&
        imgBytes[1] === 0x50 &&
        imgBytes[2] === 0x4E &&
        imgBytes[3] === 0x47
      ) {
        embedded = await pdfDoc.embedPng(imgBytes);
      } else {
        console.error("Unsupported image format uploaded");
        return res.status(400).json({
          error: "Unsupported image format — only JPG and PNG are allowed.",
        });
      }

      const scaled = embedded.scale(0.5);

      page.drawImage(embedded, {
        x: 50,
        y: 400,
        width: scaled.width,
        height: scaled.height,
      });
    }

    const pdfBytes = await pdfDoc.save();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="secret.pdf"'
    );

    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed");
  }
});


export default router;
