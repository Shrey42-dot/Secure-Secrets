// src/Components/GeneratedResult.jsx
import { QRCodeCanvas } from "qrcode.react";
import { downloadQRCode } from "../utils/qrcode";

export default function GeneratedResult({ link, copyToClipboard }) {
  return (
    <div className="mt-4 bg-gray-700 dark:bg-gray-200 p-3 rounded-md transition-colors duration-500">
      <p className="text-green-400">✅ Secret stored successfully!</p>

      <div className="mt-2 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="break-all">
          <div className="text-sm dark:text-black text-gray-300 transition-colors duration-500">
            Link
          </div>
          <div className="mt-1 flex items-center gap-2">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              {link}
            </a>

            <button
              onClick={copyToClipboard}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded flex items-center"
              title="Copy Link"
            >
              📋
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 p-2 bg-gray-800 dark:bg-gray-100 rounded">
          <QRCodeCanvas id="qrcode-canvas" value={link} size={192} includeMargin />
          <button
            onClick={downloadQRCode}
            className="mt-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
}
