// src/Components/DragDropBox.jsx

export default function DragDropBox({
	images,
	dragActive,
	handleDragOver,
	handleDragLeave,
	handleDrop,
	removeImage,
	openFilePicker,
}) {
	return (
		<div
			className={`relative mt-4 w-full p-8 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all duration-300 group
        ${
					dragActive
						? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
						: "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800"
				}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={openFilePicker}
		>
			{/* UPLOAD ICON & TEXT */}
			<div className="flex flex-col items-center gap-3 pointer-events-none">
				<svg
					className={`w-10 h-10 transition-colors duration-300 ${dragActive ? "text-indigo-500" : "text-slate-400 group-hover:text-indigo-400"}`}
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

				<div>
					<p className="text-sm font-medium text-slate-700 dark:text-slate-200">
						<span className="text-indigo-600 dark:text-indigo-400 hover:underline">
							Click to upload
						</span>{" "}
						or drag and drop
					</p>
					<p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
						Up to 20 images (JPG/PNG). Max 10MB each.
					</p>
				</div>
			</div>

			{/* IMAGE THUMBNAILS GRID */}
			{images.length > 0 && (
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 transition-all duration-500">
					{images.map((img, index) => (
						<div
							key={index}
							className="relative group/item rounded-lg overflow-hidden shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-600 transition-all duration-500"
							onClick={(e) => e.stopPropagation()}
						>
							<img
								src={`data:image/*;base64,${img}`}
								alt={`img-${index}`}
								className="w-full h-24 object-cover transition-transform duration-500 group-hover/item:scale-105"
							/>
							<button
								type="button"
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									removeImage(index);
								}}
								className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-sm opacity-0 group-hover/item:opacity-100 transition-all duration-200 hover:bg-red-600 hover:scale-110"
							>
								✕
							</button>
						</div>
					))}
				</div>
			)}

			{/* Counter */}
			{images.length > 0 && (
				<div className="absolute top-2 right-4 text-xs font-mono text-slate-400 dark:text-slate-500 pointer-events-none">
					{images.length}/20
				</div>
			)}
		</div>
	);
}
