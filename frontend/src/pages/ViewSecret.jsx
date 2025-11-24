// /mnt/data/ViewSecret.jsx
import CryptoJS from "crypto-js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ViewSecret() {
  const { token } = useParams();
  const [secretContent, setSecretContent] = useState(null);
  const [error, setError] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);

  // For password-protected flow:
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [saltHex, setSaltHex] = useState(null);
  const [ciphertext, setCiphertext] = useState(null);

  const [decryptedText, setDecryptedText] = useState(null);
  const [decryptedImageBase64, setDecryptedImageBase64] = useState(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);



  useEffect(() => {
    setError("");
    fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${token}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!data.encrypted && !data.secret && !data.secret) {
          setError("This link has expired or has already been used.");
          return;
        }

        // server returns either 'encrypted' (old name) or 'secret' (new)
        const encryptedField = data.encrypted || data.secret || null;

        // If password-protected flag is present, defer decryption until user provides password
        if (data.password_protected) {
          setNeedPassword(true);
          setSaltHex(data.salt); // expecting hex string or null
          setCiphertext(encryptedField);
          setExpiresAt(data.expires_at ? new Date(data.expires_at) : null);
          return;
        }

        // Non-password-protected → decrypt using ENV key (existing behavior)
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedField, import.meta.env.VITE_ENCRYPTION_KEY);
          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

          if (!decryptedText) {
            setError("Error decrypting secret.");
            return;
          }

          const payload = JSON.parse(decryptedText);
          setDecryptedText(payload.text);
          setDecryptedImageBase64(payload.image || null);
          setIsPasswordProtected(false);

          setExpiresAt(data.expires_at ? new Date(data.expires_at) : null);

          if (payload.image) {
            const imgSrc = `data:image/*;base64,${payload.image}`;
            setSecretContent(
              <div className="flex flex-col items-center">
                <p className="mb-3">{payload.text}</p>

                <img src={imgSrc} className="rounded-lg shadow-lg max-w-full mb-4" />

                

                {expiresAt && (
                  <p className="text-yellow-400 mt-2 text-sm">⏳ Expires at: {expiresAt.toLocaleString()}</p>
                )}
              </div>
            );
          } else {
            setSecretContent(<p>{payload.text}</p>);
          }
        } catch (err) {
          console.error(err);
          setError("Error decrypting secret.");
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Error retrieving secret.");
      });
  }, [token]);

  function decryptWithPassword() {
    setError("");
    try {
      if (!password || !saltHex || !ciphertext) {
        setError("Missing password or data.");
        return;
      }

      // reconstruct salt WordArray from hex string
      const saltWA = CryptoJS.enc.Hex.parse(saltHex);

      const derivedKey = CryptoJS.PBKDF2(password, saltWA, {
        keySize: 256 / 32,
        iterations: 10000,
      });

      const bytes = CryptoJS.AES.decrypt(ciphertext, derivedKey.toString());
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

      if (!decryptedText) {
        setError("Incorrect password or corrupted data.");
        return;
      }

      const payload = JSON.parse(decryptedText);
      setDecryptedText(payload.text);
      setDecryptedImageBase64(payload.image || null);
      setIsPasswordProtected(true);


      if (payload.image) {
        const imgSrc = `data:image/*;base64,${payload.image}`;
        setSecretContent(
          <div className="flex flex-col items-center">
            <p className="mb-3">{payload.text}</p>

            <img src={imgSrc} className="rounded-lg shadow-lg max-w-full mb-4" />

            

            {expiresAt && (
              <p className="text-yellow-400 mt-2 text-sm">⏳ Expires at: {expiresAt.toLocaleString()}</p>
            )}
          </div>
        );
      } else {
        setSecretContent(<p>{payload.text}</p>);
      }

      setNeedPassword(false);
    } catch (err) {
      console.error(err);
      setError("Incorrect password or corrupted data.");
    }
  }
  const handleDownloadPDF = async () => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/secrets/${token}/pdf`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: decryptedText,
          image: decryptedImageBase64,   // already decoded image
          password: isPasswordProtected ? password : null
        }),
      }
    );

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "secret.pdf";
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Error generating PDF");
  }
};
  return (
    <div className="bg-gray-800 dark:bg-white text-white dark:text-black p-6 rounded-xl shadow-lg text-center transition-colors duration-500">
      {needPassword ? (
        <div className="flex flex-col items-center text-white">
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
            onClick={decryptWithPassword}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
          >
            Unlock Secret
          </button>

          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      ) : secretContent ? (
        <>
          <h1 className="text-xl mb-3 font-semibold">Your Secret:</h1>

          <div className="bg-gray-900 dark:bg-gray-100 p-3 rounded-lg dark:text-black text-green-300 break-words transition-colors duration-500">
            {secretContent}
          </div>

          <p className="mt-3 text-red-400 text-sm">⚠️ This secret has now been destroyed forever.</p>
        </>
      ) : (
        <p className="text-red-400">{error || "Loading..."}</p>
      )}
      <button
        onClick={handleDownloadPDF}
        className="bg-blue-600 hover:bg-blue-700 text-black dark:text-white px-4 py-2 rounded mt-4 transition-colors duration-500"
      >
        Download Secret as PDF
      </button>

    </div>
  );
}
