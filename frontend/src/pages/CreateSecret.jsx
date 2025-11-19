import { useState } from "react";
import CryptoJS from "crypto-js";

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

      // If an image is selected, convert it to base64
      if (image) {
        base64Image = await fileToBase64(image);
      }

      // Build the combined payload
      const payload = {
        text: secret,       // <-- correct variable
        image: base64Image
      };

      // Convert to JSON string
      const jsonString = JSON.stringify(payload);

      // Encrypt on frontend
      const encrypted = CryptoJS.AES.encrypt(
        jsonString,
        import.meta.env.VITE_ENCRYPTION_KEY
      ).toString();

      // Send encrypted secret to backend
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: encrypted })
      });

      const data = await res.json();

      // Build the frontend link
      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

      // Reset inputs
      setSecret("");     // <-- correct reset
      setImage(null);

    } catch (err) {
      console.error("Error creating secret:", err);
    }

    setLoading(false);
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
