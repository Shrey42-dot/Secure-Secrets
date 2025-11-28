// src/pages/CreateSecret.jsx
import { useRef, useEffect } from "react";
import { useCreateSecret } from "../hooks/useCreateSecret";

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

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [secret]);

  const onFormSubmit = async (e) => {
    e.preventDefault();
    const success = await generateSecret();
    if (success && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">
      
      {/* LEFT COLUMN: THE FUNCTIONALITY */}
      <div className="w-full lg:w-3/5">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden transition-colors duration-500 border border-gray-100 dark:border-gray-700">
          
          {/* Header */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              New Secure Secret
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Create a single-use link that vanishes forever after being viewed.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <form onSubmit={onFormSubmit} className="space-y-6">
              
              {/* Text Area */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={secret}
                  onChange={handleSecretChange}
                  placeholder="Write your secret message here..."
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800 dark:text-white placeholder-gray-400 min-h-[120px]"
                  style={{ overflow: "hidden", resize: "none" }}
                />
              </div>

              {/* Drag and Drop */}
              <DragDropBox
                images={images}
                dragActive={dragActive}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                removeImage={removeImage}
                openFilePicker={() => fileInputRef.current.click()}
              />
              <input
                type="file"
                multiple
                accept="image/png, image/jpeg"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Settings Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Auto-Expiry (TTL)
                  </label>
                  <select
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={ttl}
                    onChange={(e) => setTtl(Number(e.target.value))}
                  >
                    <option value={600}>10 Minutes</option>
                    <option value={3600}>1 Hour</option>
                    <option value={86400}>24 Hours</option>
                    <option value={604800}>7 Days</option>
                  </select>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Extra Security
                  </label>
                  <PasswordSection
                    usePassword={usePassword}
                    setUsePassword={setUsePassword}
                    password={password}
                    setPassword={setPassword}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Encrypting & Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Secret Link</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  </>
                )}
              </button>
            </form>

            {link && <div className="mt-8 animate-fade"><GeneratedResult link={link} copyToClipboard={copyToClipboard} /></div>}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: THE TRUST & INFO */}
      <div className="w-full lg:w-2/5 space-y-6">
        
        {/* Info Card 1: Zero Knowledge */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-1">True Zero-Knowledge</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Encryption happens <strong>in your browser</strong> before data ever reaches our servers. We do not have the encryption key, so we cannot read your secrets or view your images even if we wanted to.
              </p>
            </div>
          </div>
        </div>

        {/* Info Card 2: Image Privacy */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-white mb-1">Metadata Stripping</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                When you upload images, our system automatically strips hidden <strong>EXIF data</strong> (GPS location, device model, timestamp) to protect your anonymity.
              </p>
            </div>
          </div>
        </div>

         {/* Info Card 3: Warning */}
         <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-100 dark:border-amber-800/30">
          <div className="flex items-start gap-4">
            <div className="text-amber-600 dark:text-amber-500 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-amber-800 dark:text-amber-500 mb-1 text-sm uppercase tracking-wide">User Responsibility</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                We do not moderate content as we cannot see it. You are solely responsible for the images and text you share. This tool is designed for privacy, not for illegal activities.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Notification Toast */}
      {copied && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade z-50">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">Link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}