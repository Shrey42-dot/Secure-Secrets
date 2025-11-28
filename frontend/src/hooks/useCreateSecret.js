// src/hooks/useCreateSecret.js
import { useState } from "react";
import { createSecret } from "../api/secretsapi";
import { blobToBase64, stripMetadata } from "../utils/file";
import {
	encryptWithMasterKey,
	encryptWithPassword,
} from "../utils/frontcrypto";

export function useCreateSecret() {
	const [secret, setSecret] = useState("");
	const [images, setImages] = useState([]);
	const [link, setLink] = useState("");
	const [copied, setCopied] = useState(false);
	const [ttl, setTtl] = useState(3600);
	const [loading, setLoading] = useState(false);
	const [usePassword, setUsePassword] = useState(false);
	const [password, setPassword] = useState("");
	const [dragActive, setDragActive] = useState(false);

	// Handle Text Change
	const handleSecretChange = (e) => {
		setSecret(e.target.value);
	};

	// Handle File Processing (Validation + Conversion)
	const processFiles = async (fileList) => {
		const validFiles = [...fileList].filter(
			(f) => f.type === "image/jpeg" || f.type === "image/png",
		);

		if (images.length + validFiles.length > 20) {
			alert("Maximum 20 images allowed.");
			return;
		}

		const newImages = [];

		for (const file of validFiles) {
			if (!file) continue;

			// 10MB Limit
			if (file.size > 10 * 1024 * 1024) {
				alert(`Image "${file.name}" is too large. Max 10MB allowed.`);
				return;
			}

			if (file.type !== "image/jpeg" && file.type !== "image/png") {
				alert("Only JPG or PNG allowed.");
				return;
			}

			try {
				const cleaned = await stripMetadata(file);
				const base64 = await blobToBase64(cleaned);
				newImages.push(base64);
			} catch (err) {
				console.error("Error processing file", file.name, err);
			}
		}

		setImages((prev) => [...prev, ...newImages]);
	};

	const handleDragOver = (e) => {
		e.preventDefault();
		setDragActive(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setDragActive(false);
	};

	const handleDrop = async (e) => {
		e.preventDefault();
		setDragActive(false);
		await processFiles(e.dataTransfer.files);
	};

	const handleFileSelect = async (e) => {
		await processFiles(e.target.files);
	};

	const removeImage = (index) => {
		setImages((prev) => prev.filter((_, i) => i !== index));
	};

	// Main Submission Logic
	const generateSecret = async () => {
		setLoading(true);
		try {
			const payloadObj = {
				text: secret,
				images: images,
			};

			const jsonString = JSON.stringify(payloadObj);

			let encrypted;
			let passwordProtected = false;

			if (usePassword && password.trim() !== "") {
				encrypted = await encryptWithPassword(password, jsonString);
				passwordProtected = true;
			} else {
				encrypted = await encryptWithMasterKey(jsonString);
			}

			const body = {
				secret: encrypted,
				ttl_seconds: ttl,
				password_protected: passwordProtected,
			};

			const data = await createSecret(body);
			setLink(`${import.meta.env.VITE_FRONTEND_URL}/s/${data.token}`);

			// Reset Form State
			setSecret("");
			setImages([]);
			setPassword("");
			setUsePassword(false);
			setTtl(3600);

			return true; // Return success signal
		} catch (err) {
			console.error("Error creating secret", err);
			alert("Error creating secret.");
			return false;
		} finally {
			setLoading(false);
		}
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(link).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	return {
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
	};
}
