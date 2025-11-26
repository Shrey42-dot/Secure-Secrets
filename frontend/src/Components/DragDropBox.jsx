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
      className={`mt-3 w-full p-4 border-2 rounded-lg text-center cursor-pointer transition-colors duration-500
        ${
          dragActive
            ? "border-blue-400 bg-blue-200 dark:bg-blue-900/20"
            : "border-gray-500 dark:border-gray-300 bg-gray-200 dark:bg-gray-200"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFilePicker}
    >
      <p classname= "text-black dark:text-gray-700 transition-colors duration-500">
        Drag and Drop upto 20 JPG/PNG images here, or click to browse
      </p>
      {/* IMAGE THUMBNAILS GRID */}
      {images.length > 0 && (
        <div 
          className="
            grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-5
            transition-all duration-500
          "
        >
          {images.map((img, index) => (
            <div 
              key={index}
              className="
                relative group rounded-lg overflow-hidden 
                shadow-md hover:shadow-xl 
                transition-all duration-500
              "
            >
              {/* Image */}
              <img
                src={img}
                alt={`img-${index}`}
                className="
                  w-full h-32 object-cover 
                  rounded-lg 
                  transition-all duration-500
                  group-hover:scale-105
                "
              />

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // avoid triggering file picker
                  removeImage(index);
                }}
                className="
                  absolute top-1 right-1 
                  bg-black/70 dark:bg-black/80 
                  text-white rounded-full 
                  px-[7px] py-[1px] 
                  text-xs 
                  opacity-0 group-hover:opacity-100 
                  transition-all duration-500
                  hover:bg-red-600
                "
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="text-center text-sm mt-3 text-gray-400 dark:text-gray-600 transition-colors duration-500">
        {images.length} / 20 images uploaded
      </div>
    </div>
  );
}

