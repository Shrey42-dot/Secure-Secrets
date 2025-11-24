import { useState, useRef } from "react";
import CryptoJS from "crypto-js";
import { QRCodeCanvas } from "qrcode.react";

// Removes EXIF metadata by drawing image to canvas
function stripMetadata(file) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.92
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

// Convert cleaned Blob → base64
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(blob);
  });
}

export default function CreateSecret() {
  const [secret, setSecret] = useState("");
  const [image, setImage] = useState(null);
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [ttl, setTtl] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((err) => console.error("Failed to copy: ", err));
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let base64Image = null;

      // Convert image if selected
      if (image) {
        const cleanedBlob = await stripMetadata(image);
        base64Image = await blobToBase64(cleanedBlob);
      }

      // Build payload (we'll stringify & encrypt this)
      const payloadObj = {
        text: secret,
        image: base64Image || null,
      };

      const jsonString = JSON.stringify(payloadObj);

      let encrypted;
      let saltHex = null;
      let passwordProtected = false;

      if (usePassword && password.trim() !== "") {
        // 1) Generate random salt (16 bytes)
        const salt = CryptoJS.lib.WordArray.random(16);
        saltHex = salt.toString(); // hex string

        // 2) Derive key using PBKDF2
        const derivedKey = CryptoJS.PBKDF2(password, salt, {
          keySize: 256 / 32, // 256-bit key
          iterations: 10000,
        });

        // 3) Encrypt with derived key
        encrypted = CryptoJS.AES.encrypt(jsonString, derivedKey.toString()).toString();

        passwordProtected = true;
      } else {
        // Fallback: encrypt with server-side env key (existing behavior)
        encrypted = CryptoJS.AES.encrypt(
          jsonString,
          import.meta.env.VITE_ENCRYPTION_KEY
        ).toString();

        passwordProtected = false;
      }

      // send to backend
      const body = {
        secret: encrypted,
        ttl_seconds: ttl,
        password_protected: passwordProtected,
        salt: saltHex, // null if not password-protected
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server error: ${res.status} ${text}`);
      }

      const data = await res.json();

      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

      // reset UI
      setSecret("");
      setImage(null);
      setTtl(3600);
      setPassword("");
      setUsePassword(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Error creating secret:", err);
      alert("Error creating secret. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // Download the QR as PNG (using canvas output from qrcode.react)
  const downloadQRCode = () => {
    try {
      const canvas = document.getElementById("qrcode-canvas");
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "secret-qrcode.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Failed to download QR:", err);
    }
  };
    const handleDragOver = (e) => {
      e.preventDefault();
      setDragActive(true);
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      setDragActive(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        setImage(file);
      }
    };

    const handleFileSelect = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImage(file);
      }
    };

    // For mobile "tap to upload"
    const openFilePicker = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };


  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg transition-colors duration-500">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={handleSubmit}>
        {/* TEXT INPUT */}
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black dark:text-black dark:bg-gray-200"
          rows="4"
        />

        {/* IMAGE INPUT */}
        {/* DRAG & DROP BOX */}
        <div
          className={`mt-3 w-full p-4 border-2 rounded-lg text-center cursor-pointer 
            ${dragActive 
                    ? "border-gray-500 dark:border-gray-300 bg-gray-200 dark:bg-gray-200" 
                    : "border-gray-500 dark:border-gray-300 bg-gray-200 dark:bg-gray-200"}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFilePicker}
        >
          {image ? (
            <p className="text-green-300">{image.name}</p>
          ) : (
            <p className="text-black">Drag & drop an image here, or click to browse</p>
          )}
        </div>

        {/* HIDDEN FILE INPUT (fallback for mobile) */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* TTL */}
        <select
          className="w-full mt-3 p-2 rounded-lg text-black dark:bg-gray-200 dark:text-black"
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
        >
          <option value={600}>10 minutes</option>
          <option value={3600}>1 hour (Default)</option>
          <option value={86400}>24 hours</option>
          <option value={604800}>7 days</option>
        </select>

        {/* PASSWORD TOGGLE */}
        <div className="mt-3 text-white dark:text-black transition-colors duration-500">
          <label className="flex items-center gap-2 select-none">
            <input
              type="checkbox"
              checked={usePassword}
              onChange={() => setUsePassword((s) => !s)}
            />
            <span>Add password protection</span>
          </label>

          {usePassword && (
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 p-2 rounded-lg text-black dark:bg-gray-200"
              autoComplete="new-password"
            />
          )}
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="mt-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg w-full flex justify-center items-center"
        >
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            "Generate Link"
          )}
        </button>
      </form>

      {/* SHOW GENERATED LINK + QR */}
      {link && (
        <div className="mt-4 bg-gray-700 dark:bg-gray-200 p-3 rounded-md transition-colors duration-500">
          <p className="text-green-400">✅ Secret stored successfully!</p>

          <div className="mt-2 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="break-all">
              <div className="text-sm text-black dark:text-gray-300">Link</div>
              <div className="mt-1 flex items-center gap-2">
                <a 
                  href={link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-400 hover:underline"
                >
                  {link}
                </a>

                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
                  title="Copy Link"
                >
                  📋
                </button>
              </div>
            </div>

            {/* QR CODE + DOWNLOAD */}
            <div className="flex flex-col items-center gap-2 p-2 bg-gray-800 rounded">
              <QRCodeCanvas id="qrcode-canvas" value={link} size={192} includeMargin={true} />
              <button
                onClick={downloadQRCode}
                className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      {copied && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg">
          Link copied!
        </div>
      )}
    </div>
  );
}
