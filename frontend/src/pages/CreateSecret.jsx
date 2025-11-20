import { useState } from "react";
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
  const [secret, setSecret] = useState("");       // <-- real text input
  const [image, setImage] = useState(null);   // <-- image file
  const [link, setLink] = useState("");
  const [copied , setCopied] = useState(false);
  const [ttl, setTtl] = useState(3600); 
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const copyToClipboard = () => {
  navigator.clipboard.writeText(link).
  then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  })
  .catch((err) => console.error("Failed to copy: ", err));
  };


  // Convert image to base64 string
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // remove prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let base64Image = null;

      // Convert image if selected
      if (image) {
        // 1. Strip metadata
        const cleanedBlob = await stripMetadata(image);

        // 2. Convert cleaned image to base64
        base64Image = await blobToBase64(cleanedBlob);
      }

      // Build payload
      const payload = {
        text: secret,
        image: base64Image,
        ttl_seconds: ttl
      };

      // Convert to string
      const jsonString = JSON.stringify(payload);

      // Encrypt
      const encrypted = CryptoJS.AES.encrypt(
        jsonString,
        import.meta.env.VITE_ENCRYPTION_KEY
      ).toString();

      // Send to backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: encrypted, ttl_seconds: ttl })
      });

      const data = await res.json();

      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

      setSecret("");     // <-- correct reset
      setImage(null);
      setTtl(3600);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Error creating secret:", err);
    }

    setLoading(false); // <-- ALWAYS executed
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


  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={handleSubmit}>
        
        {/* TEXT INPUT */}
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black"
          rows="4"
        />

        {/* IMAGE INPUT */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mt-3 w-full p-2 rounded-lg text-black"
        />
        <select
          className="w-full mt-3 p-2 rounded-lg text-black"
          value={ttl}
          onChange={(e) => setTtl(Number(e.target.value))}
        >
          <option value={600}>10 minutes</option>
          <option value={3600}>1 hour (Default) </option>
          <option value={86400}>24 hours</option>
          <option value={604800}>7 days</option>
        </select>


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
      <div className="mt-4 bg-gray-700 p-3 rounded-md">
        <p className="text-green-400">✅ Secret stored successfully!</p>

        <div className="mt-2 flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="break-all">
            <div className="text-sm text-gray-300">Link</div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-blue-400">{link}</span>

              {/* COPY ICON BUTTON */}
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
            {/* QRCode renders a canvas (renderAs="canvas") with specified id */}
            <QRCodeCanvas
              id="qrcode-canvas"
              value={link}
              size={192}
              includeMargin={true}
            />
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
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg
                        animate-fade duration-300">
          Link copied!
        </div>
      )}

    </div>
  );
}
