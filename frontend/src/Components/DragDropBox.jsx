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
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
    >
      {/* UPLOAD ICON & TEXT */}
      <div className="flex flex-col items-center gap-3 pointer-events-none">
        <svg 
          className={`w-10 h-10 transition-colors duration-300 ${dragActive ? "text-blue-500" : "text-gray-400 group-hover:text-blue-400"}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
            <span className="text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Up to 20 images (JPG/PNG). Max 10MB each.
          </p>
        </div>
      </div>

      {/* IMAGE THUMBNAILS GRID */}
      {images.length > 0 && (
        <div 
          className="
            grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8
            transition-all duration-500
          "
        >
          {images.map((img, index) => (
            <div 
              key={index}
              className="
                relative group/item rounded-lg overflow-hidden 
                shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-600
                transition-all duration-500
              "
              onClick={(e) => e.stopPropagation()} // Stop click from opening file picker
            >
              {/* Image Preview */}
              <img
                src={`data:image/*;base64,${img}`}
                alt={`img-${index}`}
                className="
                  w-full h-24 object-cover 
                  transition-transform duration-500
                  group-hover/item:scale-105
                "
              />

              {/* Remove Button */}
              <button
                type="button" 
                onClick={(e) => {
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  removeImage(index);
                }}
                className="
                  absolute top-1 right-1 
                  bg-red-500 text-white rounded-full 
                  w-5 h-5 flex items-center justify-center
                  text-xs font-bold shadow-sm
                  opacity-0 group-hover/item:opacity-100 
                  transition-all duration-200
                  hover:bg-red-600 hover:scale-110
                "
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      {images.length > 0 && (
         <div className="absolute top-2 right-4 text-xs font-mono text-gray-400 dark:text-gray-500 pointer-events-none">
          {images.length}/20
        </div>
      )}
    </div>
  );
}