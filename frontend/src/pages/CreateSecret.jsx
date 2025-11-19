import { useState } from "react";
import CryptoJS from "crypto-js";
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

  // Convert image to base64 string
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]); // remove prefix
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
  const [loading, setLoading] = useState(false);

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
        image: base64Image
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
        body: JSON.stringify({ secret: encrypted })
      });

      const data = await res.json();

      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

      setSecret("");     // <-- correct reset
      setImage(null);

    } catch (err) {
      console.error("Error creating secret:", err);
    }

    setLoading(false); // <-- ALWAYS executed
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
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="mt-3"
        />

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

      {/* SHOW GENERATED LINK */}
      {link && (
        <div className="mt-4 bg-gray-700 p-3 rounded-md">
          <p className="text-green-400">✅ Secret stored successfully!</p>
          <p className="mt-2 break-all">
            Share this link: <span className="text-blue-400">{link}</span>
          </p>
        </div>
      )}
    </div>
  );
}
