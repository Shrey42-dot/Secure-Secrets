// src/pages/ViewSecret.jsx
import { useParams } from "react-router-dom";
import { useViewSecret } from "../hooks/useViewSecret"; 

export default function ViewSecret() {
  const { token } = useParams();
  
  const {
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
  } = useViewSecret(token);

  const renderSecretContent = () => {
    if (!decryptedText && decryptedImages.length === 0) return null;

    return (
      <div className="space-y-6 animate-fade">
        {/* Text Content */}
        {decryptedText && (
           <div className="relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-20 group-hover:opacity-40 transition duration-1000 blur"></div>
             <div className="relative p-6 bg-gray-900 rounded-lg border border-gray-700 shadow-inner">
               <pre className="whitespace-pre-wrap font-sans text-gray-100 text-lg leading-relaxed text-left">
                 {decryptedText}
               </pre>
             </div>
           </div>
        )}

        {/* Image Grid */}
        {decryptedImages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {decryptedImages.map((img, index) => (
              <div key={index} className="relative group rounded-xl overflow-hidden shadow-2xl border border-gray-700 bg-black">
                <img
                  src={`data:image/*;base64,${img}`}
                  className="w-full h-auto object-contain max-h-[500px]"
                  alt={`secret-img-${index}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 py-12">
      
      {/* CARD CONTAINER */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-colors duration-500">
        
        {/* SECURITY HEADER */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
             {decryptedText || decryptedImages.length > 0 ? (
               <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
             ) : (
               <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
             )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {needPassword ? "Password Required" : (decryptedText || decryptedImages.length > 0) ? "Secret Decrypted" : "Accessing Vault..."}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
             {needPassword ? "The sender has secured this secret with a password." : "This content is end-to-end encrypted."}
          </p>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="p-6 md:p-10">
          
          {needPassword ? (
            <div className="max-w-sm mx-auto flex flex-col items-center animate-fade">
              <input
                type="password"
                placeholder="Enter password to unlock"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none text-center text-lg tracking-widest text-gray-800 dark:text-white mb-4"
                autoFocus
              />
              <button
                onClick={handleUnlock}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Decrypt & Open
              </button>
              {error && (
                <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   {error}
                </div>
              )}
            </div>

          ) : decryptedText || decryptedImages.length > 0 ? (
            <div className="flex flex-col">
              {renderSecretContent()}

              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                
                <div className="text-left">
                  <p className="text-red-500 font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    Burn-on-read Active
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This secret has been deleted from our servers. <br/>Once you close this tab, it is gone forever.
                  </p>
                  {expiresAt && (
                    <p className="text-xs text-gray-400 mt-1">Original Expiry: {expiresAt.toLocaleString()}</p>
                  )}
                </div>

                <button
                  onClick={downloadPDF}
                  disabled={generatingPdf}
                  className="w-full sm:w-auto bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {generatingPdf ? "Generating..." : "Save as PDF"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
              </div>
            </div>

          ) : (
             <div className="py-12 flex flex-col items-center">
                {error ? (
                   <div className="text-center">
                     <div className="text-5xl mb-4">👻</div>
                     <h3 className="text-xl font-bold text-gray-800 dark:text-white">Secret Not Found</h3>
                     <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">{error}</p>
                   </div>
                ) : (
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-2 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                )}
             </div>
          )}
        </div>
      </div>
      
      {/* FOOTER INFO */}
      <div className="mt-8 text-center text-sm text-gray-400">
        <p>🔒 Zero-Knowledge Architecture • End-to-End Encrypted</p>
      </div>
    </div>
  );
}