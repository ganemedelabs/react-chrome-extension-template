// See https://v3.vitejs.dev/config/ for more about configuration files.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

export default defineConfig({
    plugins: [react(), tailwindcss()],
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, "index.html"),
                serviceWorker: resolve(__dirname, "src/serviceWorker.ts"),
            },
            output: {
                entryFileNames: "[name].bundle.js",
                format: "es",
            },
        },
        emptyOutDir: true,
        outDir: "dist",
    },
});
