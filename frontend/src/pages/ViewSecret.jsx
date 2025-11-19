import CryptoJS from "crypto-js";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ViewSecret() {
  const { token } = useParams();
  const [secretContent, setSecretContent] = useState(null);
  const [error, setError] = useState("");
  const copyImage = async (base64) => {
    const res = await fetch(`data:image/jpeg;base64,${base64}`);
    const blob = await res.blob();

    await navigator.clipboard.write([
      new ClipboardItem({ "image/jpeg": blob })
    ]);

    alert("Image copied to clipboard!");
  };

  const downloadImage = (base64) => {
    const link = document.createElement("a");
    link.href = `data:image/jpeg;base64,${base64}`;
    link.download = "secret-image.jpg";
    link.click();
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/secrets/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.encrypted) {
          setError("This link has expired or has already been used.");
          return;
        }

        try {
          // Decrypt using AES (frontend only)
          const bytes = CryptoJS.AES.decrypt(
            data.encrypted,
            import.meta.env.VITE_ENCRYPTION_KEY
          );

          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);

          // Parse decrypted JSON → { text, image }
          const payload = JSON.parse(decryptedText);

          // If there is an image
          if (payload.image) {
            const imgSrc = `data:image/*;base64,${payload.image}`;
            setSecretContent(
              <div className="flex flex-col items-center">
                <p className="mb-3">{payload.text}</p>

                <img
                  src={imgSrc}
                  className="rounded-lg shadow-lg max-w-full mb-4"
                />

                {/* Copy + Download Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => copyImage(payload.image)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
                  >
                    Copy Image
                  </button>

                  <button
                    onClick={() => downloadImage(payload.image)}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                  >
                    Download Image
                  </button>
                </div>
              </div>
            );
          } else {
            // Only text
            setSecretContent(<p>{payload.text}</p>);
          }
        } catch (err) {
          console.error(err);
          setError("Error decrypting secret.");
        }
      })
      .catch(() => setError("Error retrieving secret."));
  }, [token]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center">
      {secretContent ? (
        <>
          <h1 className="text-xl mb-3 font-semibold">Your Secret:</h1>

          <div className="bg-gray-900 p-3 rounded-lg text-green-300 break-words">
            {secretContent}
          </div>

          <p className="mt-3 text-red-400 text-sm">
            ⚠️ This secret has now been destroyed forever.
          </p>
        </>
      ) : (
        <p className="text-red-400">{error}</p>
      )}
    </div>
  );
}
