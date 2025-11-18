import { useState } from "react";

export default function CreateSecret() {
  const [secret, setSecret] = useState("");
  const [link, setLink] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLink("");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/secrets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (data.token) {
        setLink(`${import.meta.env.VITE_API_URL}/s/${data.token}`);
        setSecret("");
      }
    } catch (err) {
      console.error("Error creating secret:", err);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
      <h1 className="text-xl mb-4 font-semibold">Create a One-Time Secret</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Type your secret here..."
          className="w-full p-3 rounded-lg text-black"
          rows="4"
        />
        <button
          type="submit"
          className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg w-full"
        >
          Generate Link
        </button>
      </form>

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
