// src/pages/CreateSecret.jsx
import { useRef, useEffect } from "react";
import { useCreateSecret } from "../hooks/useCreateSecret"; // Import the hook

// components
import DragDropBox from "../Components/DragDropBox";
import PasswordSection from "../Components/PasswordSection";
import GeneratedResult from "../Components/GeneratedResult";

export default function CreateSecret() {
  const {
    secret,
    handleSecretChange,
    images,
    link,
    copied,
    ttl,
    setTtl,
    loading,
    usePassword,
    setUsePassword,
    password,
    setPassword,
    dragActive,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    removeImage,
    generateSecret,
    copyToClipboard,
  } = useCreateSecret();

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-expand textarea (UI Logic stays here)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [secret]);

  // Wrapper to handle DOM Ref clearing after success
  const onFormSubmit = async (e) => {
    e.preventDefault();
    const success = await generateSecret();
    if (success && fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear file input UI
    }
  };

  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg transition-colors duration-500">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>

      <form onSubmit={onFormSubmit}>
        <textarea
          ref={textareaRef}
          value={secret}
          onChange={handleSecretChange}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black dark:text-black dark:bg-gray-200"
          rows={1}
          style={{
            overflow: "hidden",
            resize: "none",
          }}
        />

        <DragDropBox
          images={images}
          dragActive={dragActive}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          removeImage={removeImage}
          openFilePicker={() => fileInputRef.current.click()}
        />

        {/* Hidden file input */}
        <input
          type="file"
          multiple
          accept="image/png, image/jpeg"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

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
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full">
              Generating..
            </div>
          ) : (
            "Generate Link"
          )}
        </button>
      </form>

      {link && <GeneratedResult link={link} copyToClipboard={copyToClipboard} />}

      {copied && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg shadow-lg">
          Link copied!
        </div>
      )}
    </div>
  );
}