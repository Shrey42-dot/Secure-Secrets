// src/hooks/useViewSecret.js
import { useState, useEffect } from "react";
import { decryptWithMasterKey, decryptWithPassword as webDecrypt } from "../utils/frontcrypto";
import { PDFDocument, StandardFonts } from "pdf-lib";

// --- HELPER FUNCTIONS (Keep these outside the hook to save memory) ---
function base64ToUint8Array(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function sanitizeForPDF(str) {
  if (!str) return "";
  return str
    .replace(/[^\x20-\x7E\n\r\t]/g, "?")
    .replace(/\t/g, "    ")
    .replace(/\r/g, "")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
    .replace(/\\/g, "\\\\");
}

function wordWrap(text, font, fontSize, maxWidth) {
  const lines = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    const words = paragraph.split(' ');
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + " " + word, fontSize);
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
  }
  return lines;
}

async function drawMultilineText(pdfDoc, text, font, fontSize, maxWidth, startX, startY, lineHeight = 18) {
  const pages = [];
  let page = pdfDoc.addPage([600, 800]);
  pages.push(page);

  let y = startY;
  const wrappedLines = wordWrap(text, font, fontSize, maxWidth);

  for (const line of wrappedLines) {
    if (y < 50) {
      page = pdfDoc.addPage([600, 800]);
      pages.push(page);
      y = 750;
    }
    page.drawText(line, { x: startX, y, size: fontSize, font });
    y -= lineHeight;
  }
  return pages;
}

export function useViewSecret(token) {
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  
  // Password Logic
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [ciphertext, setCiphertext] = useState(null);
  
  // Decrypted Content
  const [decryptedText, setDecryptedText] = useState(null);
  const [decryptedImages, setDecryptedImages] = useState([]);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  
  // PDF State
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // 1. Fetch Secret on Mount
  useEffect(() => {
    if (!token) return;
    
    setError("");
    fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${token}`)
      .then((res) => {
        if (res.status === 410) {
          setError("This link has expired or has already been used.");
          return null;
        }
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        if (!data.encrypted && !data.secret) {
          setError("This link has expired or has already been used.");
          return;
        }

        const encryptedField = data.encrypted || data.secret || null;

        if (data.password_protected) {
          setNeedPassword(true);
          setCiphertext(encryptedField);
          setExpiresAt(data.expires_at ? new Date(data.expires_at) : null);
          setIsPasswordProtected(true);
          return;
        }

        decryptWithMasterKey(encryptedField)
          .then((decryptedTextString) => {
            const payload = JSON.parse(decryptedTextString);
            setDecryptedText(payload.text);
            setDecryptedImages(Array.isArray(payload.images) ? payload.images : []);
            setIsPasswordProtected(false);
            setExpiresAt(data.expires_at ? new Date(data.expires_at) : null);
          })
          .catch(() => setError("Error decrypting secret."));
      })
      .catch(() => setError("Error retrieving secret."));
  }, [token]);

  // 2. Handle Password Decryption
  async function handleUnlock() {
    setError("");
    try {
      if (!password || !ciphertext) {
        setError("Missing password or data.");
        return;
      }
      const decryptedTextString = await webDecrypt(password, ciphertext);
      const payload = JSON.parse(decryptedTextString);
      setDecryptedText(payload.text);
      setDecryptedImages(Array.isArray(payload.images) ? payload.images : []);
      setIsPasswordProtected(false);
      setNeedPassword(false);
    } catch (err) {
      setError("Incorrect password or corrupted data.");
    }
  }

  // 3. Handle PDF Generation
  const downloadPDF = async () => {
    try {
      if (!decryptedText && decryptedImages.length === 0) {
        alert("Secret is not loaded yet.");
        return;
      }
      setGeneratingPdf(true);

      const pdfDoc = await PDFDocument.create();

      if (isPasswordProtected && password) {
        pdfDoc.encrypt({
          ownerPassword: password,
          userPassword: password,
          permissions: { printing: 'highResolution', modifying: false, copying: false }
        });
      }

      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontSize = 14;
      const safeText = sanitizeForPDF(decryptedText || " ");

      // Draw Text
      if (decryptedText && decryptedText.trim().length > 0) {
        await drawMultilineText(pdfDoc, safeText, font, fontSize, 500, 50, 750);
      } else {
        if (!decryptedImages || decryptedImages.length === 0) {
          pdfDoc.addPage([600, 800]);
        }
      }

      // Draw Images
      if (decryptedImages && decryptedImages.length > 0) {
        for (const imgBase64 of decryptedImages) {
          if (!imgBase64) continue;
          try {
            const imgBytes = base64ToUint8Array(imgBase64);
            let embedded;
            if (imgBytes[0] === 0xff && imgBytes[1] === 0xd8) {
              embedded = await pdfDoc.embedJpg(imgBytes);
            } else if (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) {
              embedded = await pdfDoc.embedPng(imgBytes);
            } else {
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

          } catch (e) {
            console.error("Error embedding image in PDF", e);
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "secret.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Error generating PDF locally.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  return {
    error,
    expiresAt,
    needPassword,
    password,
    setPassword,
    handleUnlock,
    decryptedText,
    decryptedImages,
    downloadPDF,
    generatingPdf
  };
}