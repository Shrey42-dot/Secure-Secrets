// src/pages/CreateSecret.jsx
import { useEffect, useRef } from "react";
// components
import DragDropBox from "../Components/DragDropBox";
import GeneratedResult from "../Components/GeneratedResult";
import PasswordSection from "../Components/PasswordSection";
import { useCreateSecret } from "../hooks/useCreateSecret";

export default function CreateSecret() {
	const {
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
	} = useCreateSecret();

	const textareaRef = useRef(null);
	const fileInputRef = useRef(null);

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
			textareaRef.current.style.height =
				textareaRef.current.scrollHeight + "px";
		}
	}, [secret]);

	const onFormSubmit = async (e) => {
		e.preventDefault();
		const success = await generateSecret();
		if (success && fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		// MAIN WRAPPER
		<div className="max-w-6xl mx-auto w-full px-4 py-12 flex flex-col lg:flex-row gap-8 items-start transition-all duration-500 ease-in-out">
			{/* LEFT COLUMN: FUNCTIONALITY */}
			<div className="w-full lg:w-3/5">
				<div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out">
					{/* Header */}
					<div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 transition-colors duration-500">
						<h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
							<div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-lg text-indigo-600 dark:text-indigo-400">
								<svg
									className="w-6 h-6"
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
							</div>
							New Secure Secret
						</h1>
						<p className="text-slate-500 dark:text-slate-400 text-sm mt-1 ml-11">
							Create a self-destructing link. Encrypted in your browser.
						</p>
					</div>

					<div className="p-6 md:p-8">
						<form onSubmit={onFormSubmit} className="space-y-6">
							{/* Text Area */}
							<div className="relative group">
								<textarea
									ref={textareaRef}
									value={secret}
									onChange={handleSecretChange}
									placeholder="Write your secret message here..."
									className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 
                             focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none 
                             text-slate-800 dark:text-slate-200 placeholder-slate-400 
                             transition-all duration-300 min-h-[120px]"
									style={{ overflow: "hidden", resize: "none" }}
								/>
								{/* Subtle Glow Effect on Focus */}
								<div className="absolute inset-0 rounded-xl bg-indigo-500/5 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity duration-500" />
							</div>

							{/* Drag and Drop */}
							<DragDropBox
								images={images}
								dragActive={dragActive}
								handleDragOver={handleDragOver}
								handleDragLeave={handleDragLeave}
								handleDrop={handleDrop}
								removeImage={removeImage}
								openFilePicker={() => fileInputRef.current.click()}
							/>
							<input
								type="file"
								multiple
								accept="image/png, image/jpeg"
								ref={fileInputRef}
								onChange={handleFileSelect}
								className="hidden"
							/>

							{/* Settings Grid */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 transition-colors duration-500">
								<div>
									<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
										Auto-Expiry (TTL)
									</label>
									<div className="relative">
										<select
											className="w-full p-2.5 pl-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 
                                 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none transition-colors duration-300"
											value={ttl}
											onChange={(e) => setTtl(Number(e.target.value))}
										>
											<option value={600}>10 Minutes</option>
											<option value={3600}>1 Hour</option>
											<option value={86400}>24 Hours</option>
											<option value={604800}>7 Days</option>
										</select>
										{/* Custom Arrow */}
										<div className="absolute right-3 top-3 pointer-events-none text-slate-400">
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
													d="M19 9l-7 7-7-7"
												></path>
											</svg>
										</div>
									</div>
								</div>

								<div>
									<label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
										Extra Security
									</label>
									<PasswordSection
										usePassword={usePassword}
										setUsePassword={setUsePassword}
										password={password}
										setPassword={setPassword}
									/>
								</div>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={loading}
								className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 
                           text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-indigo-500/20 
                           transform transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed 
                           flex justify-center items-center gap-2"
							>
								{loading ? (
									<>
										<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
										<span>Encrypting...</span>
									</>
								) : (
									<>
										<span>Create Secret Link</span>
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											></path>
										</svg>
									</>
								)}
							</button>
						</form>

						{link && (
							<div className="mt-8 animate-fade">
								<GeneratedResult
									link={link}
									copyToClipboard={copyToClipboard}
								/>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* RIGHT COLUMN: TRUST & INFO */}
			<div className="w-full lg:w-2/5 space-y-6">
				{/* Info Card 1 */}
				<div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-500">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-emerald-100 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<div>
							<h3 className="font-bold text-slate-800 dark:text-white mb-1">
								True Zero-Knowledge
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
								Encryption happens <strong>locally</strong>. We never see your
								password, text, or images.
							</p>
						</div>
					</div>
				</div>

				{/* Info Card 2 */}
				<div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-500">
					<div className="flex items-start gap-4">
						<div className="p-3 bg-sky-100 dark:bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="2"
									d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
								></path>
							</svg>
						</div>
						<div>
							<h3 className="font-bold text-slate-800 dark:text-white mb-1">
								Metadata Scrubbing
							</h3>
							<p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
								We automatically strip <strong>EXIF data</strong> (GPS, device
								info) from images to protect your anonymity.
							</p>
						</div>
					</div>
				</div>

				{/* Warning Card */}
				<div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200 dark:border-amber-800/30 transition-colors duration-500">
					<div className="flex items-start gap-4">
						<div className="text-amber-600 dark:text-amber-500 mt-1">
							<svg
								className="w-5 h-5"
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
						</div>
						<div>
							<h3 className="font-bold text-amber-800 dark:text-amber-500 mb-1 text-sm uppercase tracking-wide">
								Disclaimer
							</h3>
							<p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
								You are responsible for the content you share. This tool is for
								privacy, not illegal acts.
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Toast */}
			{copied && (
				<div className="fixed bottom-6 right-6 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade z-50">
					<svg
						className="w-5 h-5 text-emerald-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
					<span className="font-medium">Link copied!</span>
				</div>
			)}
		</div>
	);
}
