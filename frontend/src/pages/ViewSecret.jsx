// src/pages/ViewSecret.jsx
import { useParams } from "react-router-dom";
import { useViewSecret } from "../hooks/useViewSecret"; // Import the hook

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

  // UI Helper: Determine what to render for the secret content
  const renderSecretContent = () => {
    if (!decryptedText && decryptedImages.length === 0) return null;

    return (
      <div className="flex flex-col items-center">
        {decryptedText && <p className="mb-3 whitespace-pre-wrap">{decryptedText}</p>}
        {decryptedImages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {decryptedImages.map((img, index) => (
              <img
                key={index}
                src={`data:image/*;base64,${img}`}
                className="rounded-lg shadow-lg max-w-full h-auto object-cover"
                alt={`secret-img-${index}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg text-center transition-colors duration-500">
      {needPassword ? (
        <div className="flex flex-col items-center text-white dark:text-black transition-colors duration-500">
          <h2 className="text-lg mb-2">This secret is password protected</h2>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2 rounded text-black dark:bg-gray-200 w-full max-w-xs"
            autoFocus
          />
          <button
            onClick={handleUnlock}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Unlock Secret
          </button>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      ) : decryptedText || decryptedImages.length > 0 ? (
        <>
          <h1 className="text-xl mb-3 font-semibold">Your Secret:</h1>
          <div className="bg-gray-900 dark:bg-gray-100 p-3 rounded-lg dark:text-black text-green-300 break-words transition-colors duration-500">
            {renderSecretContent()}
          </div>
          <button
            onClick={downloadPDF}
            disabled={generatingPdf}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mt-4 transition-colors duration-500 disabled:opacity-50"
          >
            {generatingPdf ? "Generating PDF..." : "Download Secret as PDF"}
          </button>
          <div>
            {expiresAt && (
              <p className="text-yellow-400 mt-2 text-sm">
                ⏳ Expires at: {expiresAt.toLocaleString()}
              </p>
            )}
          </div>
          <p className="mt-3 text-red-400 text-sm">
            ⚠️ This secret has now been destroyed forever.
          </p>
        </>
      ) : (
        <p className="text-red-400">{error || "Loading..."}</p>
      )}
    </div>
  );
}