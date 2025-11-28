import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	build: {
		chunkSizeWarningLimit: 1000, // Increase limit from 500kB to 1000kB (1MB)
	},
});
