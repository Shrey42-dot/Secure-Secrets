import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function ViewSecret() {
  const { token } = useParams();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`http://localhost:4000/api/secrets/${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.secret) setSecret(data.secret);
        else setError("This link has expired or has already been used.");
      })
      .catch(() => setError("Error retrieving secret."));
  }, [token]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg text-center">
      {secret ? (
        <>
          <h1 className="text-xl mb-3 font-semibold">Your Secret:</h1>
          <p className="bg-gray-900 p-3 rounded-lg text-green-300 break-all">
            {secret}
          </p>
          <p className="mt-3 text-red-400 text-sm">
            ⚠️ This secret will not be available again.
          </p>
        </>
      ) : (
        <p className="text-red-400">{error}</p>
      )}
    </div>
  );
}
