// Removes EXIF metadata by drawing image to canvas
export function stripMetadata(file) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);

			canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
		};
		img.src = URL.createObjectURL(file);
	});
}

// Convert cleaned Blob → base64
export function blobToBase64(blob) {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result.split(",")[1]);
		reader.readAsDataURL(blob);
	});
}
