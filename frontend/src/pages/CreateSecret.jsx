import { useState } from "react";
import CryptoJS from "crypto-js";

export default function CreateSecret() {
  const [text, setText] = useState("");       // <-- real text input
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

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault(); // IMPORTANT — prevent page reload

    let base64Image = null;

    // If image is selected, convert it to base64
    if (image) {
      base64Image = await fileToBase64(image);
    }

    // Build the combined payload
    const payload = {
      text: text,           // <-- text typed by user
      image: base64Image // <-- base64 image or null
    };

    // Convert payload to string
    const jsonString = JSON.stringify(payload);

    // Encrypt on frontend using AES
    const encrypted = CryptoJS.AES.encrypt(
      jsonString, 
      import.meta.env.VITE_ENCRYPTION_KEY
    ).toString();

    // Send encrypted string to backend
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret: encrypted })
    });

    const data = await res.json();

    // Build frontend link (your original logic)
    setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

    // Reset inputs
    setText("");
    setImage(null);
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={handleSubmit}>
        
        {/* TEXT INPUT */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
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
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full"
        >
          Generate Link
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
