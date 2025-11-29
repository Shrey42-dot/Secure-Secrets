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
		generatingPdf,
	} = useViewSecret(token);

	const renderSecretContent = () => {
		if (!decryptedText && decryptedImages.length === 0) return null;

		return (
			<div className="space-y-6 animate-fade">
				{/* Text Content */}
				{decryptedText && (
					<div className="relative group">
						{/* Glow Effect */}
						<div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-1000 blur"></div>
						<div className="relative p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner transition-colors duration-500">
							<pre className="whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200 text-lg leading-relaxed text-left">
								{decryptedText}
							</pre>
						</div>
					</div>
				)}

				{/* Image Grid */}
				{decryptedImages.length > 0 && (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
						{decryptedImages.map((img, index) => (
							<div
								key={index}
								className="relative group rounded-xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950"
							>
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
		<div className="max-w-4xl mx-auto w-full px-4 py-12 transition-all duration-500 ease-in-out">
			{/* CARD CONTAINER */}
			<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-500">
				{/* SECURITY HEADER */}
				<div className="bg-slate-50 dark:bg-slate-950/50 p-8 border-b border-slate-200 dark:border-slate-800 text-center transition-colors duration-500">
					<div className="inline-flex items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-full mb-4">
						{decryptedText || decryptedImages.length > 0 ? (
							<svg
								className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
								></path>
							</svg>
						) : (
							<svg
								className="w-8 h-8 text-slate-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								></path>
							</svg>
						)}
					</div>
					<h1 className="text-3xl font-bold text-slate-800 dark:text-white">
						{needPassword
							? "Password Required"
							: decryptedText || decryptedImages.length > 0
								? "Secret Decrypted"
								: "Accessing Vault..."}
					</h1>
					<p className="text-slate-500 dark:text-slate-400 mt-2">
						{needPassword
							? "The sender has secured this secret with a password."
							: "End-to-end encrypted content."}
					</p>
				</div>

				{/* MAIN CONTENT AREA */}
				<div className="p-6 md:p-10 bg-white dark:bg-slate-900 transition-colors duration-500">
					{needPassword ? (
						<div className="max-w-sm mx-auto flex flex-col items-center animate-fade">
							<input
								type="password"
								placeholder="Enter password..."
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 
                           focus:ring-2 focus:ring-indigo-500 outline-none text-center text-lg tracking-widest 
                           text-slate-800 dark:text-white mb-4 transition-all duration-300"
								autoFocus
							/>
							<button
								onClick={handleUnlock}
								className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-transform hover:-translate-y-0.5"
							>
								Decrypt & Open
							</button>
							{error && (
								<div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm flex items-center gap-2 border border-red-100 dark:border-red-900/30">
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										></path>
									</svg>
									{error}
								</div>
							)}
						</div>
					) : decryptedText || decryptedImages.length > 0 ? (
						<div className="flex flex-col">
							{renderSecretContent()}

							<div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
								<div className="text-left">
									<p className="text-rose-500 font-bold flex items-center gap-2">
										<svg
											className="w-5 h-5 animate-pulse"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
											></path>
										</svg>
										Burn-on-read Active
									</p>
									<p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
										This secret has been deleted from our servers. <br />
										Once you close this tab, it is gone forever.
									</p>
									{expiresAt && (
										<p className="text-xs text-slate-400 mt-1">
											Original Expiry: {expiresAt.toLocaleString()}
										</p>
									)}
								</div>

								<button
									onClick={downloadPDF}
									disabled={generatingPdf}
									className="w-full sm:w-auto bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 
                             text-slate-800 dark:text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
								>
									{generatingPdf ? "Generating..." : "Save as PDF"}
									<svg
										className="w-4 h-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
										></path>
									</svg>
								</button>
							</div>
						</div>
					) : (
						<div className="py-12 flex flex-col items-center">
							{error ? (
								<div className="text-center animate-fade">
									<div className="text-6xl mb-4">👻</div>
									<h3 className="text-2xl font-bold text-slate-800 dark:text-white">
										Secret Not Found
									</h3>
									<p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto">
										{error}
									</p>
								</div>
							) : (
								<div className="animate-pulse flex flex-col items-center">
									<div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
									<div className="h-2 w-48 bg-slate-200 dark:bg-slate-700 rounded"></div>
								</div>
							)}
						</div>
					)}
				</div>
			</div>

			{/* FOOTER INFO */}
			<div className="mt-8 text-center text-sm text-slate-400 dark:text-slate-500">
				<p>🔒 Zero-Knowledge Architecture • End-to-End Encrypted</p>
			</div>
		</div>
	);
}
