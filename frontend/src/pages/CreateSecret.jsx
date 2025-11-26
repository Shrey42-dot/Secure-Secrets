// src/pages/CreateSecret.jsx
import { useState, useRef } from "react";
import { encryptWithMasterKey} from "../utils/frontcrypto";  

// utils
import { stripMetadata, blobToBase64 } from "../utils/file";
import { encryptWithPassword } from "../utils/frontcrypto";

// API
import { createSecret } from "../api/secretsapi";

// components
import DragDropBox from "../Components/DragDropBox";
import PasswordSection from "../Components/PasswordSection";
import GeneratedResult from "../Components/GeneratedResult";

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let base64Image = null;

      if (image) {
        const cleanedBlob = await stripMetadata(image);
        base64Image = await blobToBase64(cleanedBlob);
      }

      const payloadObj = {
        text: secret,
        image: base64Image || null,
      };

      const jsonString = JSON.stringify(payloadObj);

      let encrypted;
      let saltHex = null;
      let passwordProtected = false;
      if (usePassword && password.trim !== ""){
        encrypted = await encryptWithPassword(password, jsonString);
        passwordProtected = true;
      } else {
        encrypted = await encryptWithMasterKey(jsonString);
        passwordProtected = false;
      }
      const body = {
        secret: encrypted,
        ttl_seconds: ttl,
        password_protected: passwordProtected,
      };

      const data = await createSecret(body);

      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

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

  // Drag & drop logic (still here, UI is in DragDropBox)
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
    if (!file) return;

    // ✅ allow only JPG / PNG
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      alert("Only JPG and PNG images are allowed.");
      return;
    }

    setImage(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ allow only JPG / PNG
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      alert("Only JPG and PNG images are allowed.");
      return;
    }

    setImage(file);
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg transition-colors duration-500">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black dark:text-black dark:bg-gray-200"
          rows="4"
        />

        {/* Drag & Drop box component */}
        <DragDropBox
          image={image}
          dragActive={dragActive}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          openFilePicker={openFilePicker}
        />

        {/* Hidden file input for mobile */}
        <input
          type="file"
          accept="image/png, image/jpeg"  // ✅ restrict to JPG/PNG
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* TTL select */}
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

        {/* Password section component */}
        <PasswordSection
          usePassword={usePassword}
          setUsePassword={setUsePassword}
          password={password}
          setPassword={setPassword}
        />

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

      {link && (
        <GeneratedResult link={link} copyToClipboard={copyToClipboard} />
      )}

      {copied && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg">
          Link copied!
        </div>
      )}
    </div>
  );
}
