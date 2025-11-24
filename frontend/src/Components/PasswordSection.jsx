// src/Components/PasswordSection.jsx

export default function PasswordSection({
  usePassword,
  setUsePassword,
  password,
  setPassword,
}) {
  return (
    <div className="mt-3 text-white dark:text-black transition-colors duration-500">
      <label className="flex items-center gap-2 select-none">
        <input
          type="checkbox"
          checked={usePassword}
          onChange={() => setUsePassword((prev) => !prev)}
        />
        <span>Add password protection</span>
      </label>

      {usePassword && (
        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mt-2 p-2 rounded-lg text-black dark:bg-gray-200"
          autoComplete="new-password"
        />
      )}
    </div>
  );
}
