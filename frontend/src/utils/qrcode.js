// Download the QR as PNG (using canvas output from qrcode.react)
export function downloadQRCode() {
try {
    const canvas = document.getElementById("qrcode-canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "secret-qrcode.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
} catch (err) {
    console.error("Failed to download QR:", err);
}
}