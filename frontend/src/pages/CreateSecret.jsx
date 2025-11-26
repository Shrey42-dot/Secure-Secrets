// src/pages/CreateSecret.jsx
import { useState, useRef, useEffect } from "react";
import { encryptWithMasterKey, encryptWithPassword } from "../utils/frontcrypto";  

// utils
import { stripMetadata, blobToBase64 } from "../utils/file";

// API
import { createSecret } from "../api/secretsapi";

// components
import DragDropBox from "../Components/DragDropBox";
import PasswordSection from "../Components/PasswordSection";
import GeneratedResult from "../Components/GeneratedResult";

export default function CreateSecret() {
  const [secret, setSecret] = useState("");
  const [images, setImages] = useState([]);   // 🔥 MULTIPLE IMAGES
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [ttl, setTtl] = useState(3600);
  const [loading, setLoading] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // 🔥 AUTO EXPAND TEXTAREA
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [secret]);

  const handleSecretChange = (e) => {
    setSecret(e.target.value);
  };

  // 🔥 HANDLE DROPPED FILES (MULTIPLE)
  const handleFiles = async (fileList) => {
    const validFiles = [...fileList].filter(
      f => f.type === "image/jpeg" || f.type === "image/png"
    );

    if (images.length + validFiles.length > 20) {
      alert("Maximum 20 images allowed.");
      return;
    }

    const newImages = [];

    for (const file of validFiles) {
      if (!file) continue;

      if (file.size > 2000 * 1024) {
        alert("Image too large. Max 2MB allowed.");
        return;
      }

      if (file.type !== "image/jpeg" && file.type !== "image/png") {
        alert("Only JPG or PNG allowed.");
        return;
      }

      const cleaned = await stripMetadata(file);
      const base64 = await blobToBase64(cleaned);

      newImages.push(base64);
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    await handleFiles(files);
  };

  const handleFileSelect = async (e) => {
    const files = e.target.files;
    await handleFiles(files);
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // GENERATE SECRET
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payloadObj = {
        text: secret,
        images: images,  // 🔥 MULTIPLE IMAGES
      };

      const jsonString = JSON.stringify(payloadObj);

      let encrypted;
      let passwordProtected = false;

      if (usePassword && password.trim() !== "") {
        encrypted = await encryptWithPassword(password, jsonString);
        passwordProtected = true;
      } else {
        encrypted = await encryptWithMasterKey(jsonString);
      }

      const body = {
        secret: encrypted,
        ttl_seconds: ttl,
        password_protected: passwordProtected,
      };

      const data = await createSecret(body);

      setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

      // RESET FORM
      setSecret("");
      setImages([]);
      setPassword("");
      setUsePassword(false);
      setTtl(3600);

      if (fileInputRef.current) fileInputRef.current.value = "";

    } catch (err) {
      console.error("Error creating secret");
      alert("Error creating secret.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg transition-colors duration-500">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          ref = {textareaRef}
          value={secret}
          onChange={handleSecretChange}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black dark:text-black dark:bg-gray-200"
          rows={1}
          style= {{
            overflow: "hidden",
            resize: "none",
          }}
        />

        {/* Drag & Drop box component */}
        <DragDropBox
          images={images}
          dragActive={dragActive}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          removeImage={removeImage}
          openFilePicker={() => fileInputRef.current.click()}
        />

        {/* Hidden file input for mobile */}
        <input
          type="file"
          multiple  // 🔥 allow multiple files
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
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full">Generating..</div>
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
