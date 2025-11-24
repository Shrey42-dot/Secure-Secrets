// src/Components/DragDropBox.jsx

export default function DragDropBox({
  image,
  dragActive,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  openFilePicker,
}) {
  return (
    <div
      className={`mt-3 w-full p-4 border-2 rounded-lg text-center cursor-pointer transition-colors
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
      {image ? (
        <p className="text-black dark:text-black">{image.name}</p>
      ) : (
        <p className="text-black dark:text-gray-700">
          Drag & drop a JPG/PNG image here, or click to browse
        </p>
      )}
    </div>
  );
}
