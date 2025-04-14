// See https://v3.vitejs.dev/config/ for more about configuration files.

import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = resolve(fileURLToPath(import.meta.url), "..");

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                content: resolve(__dirname, "src/content.ts"),
            },
            output: {
                entryFileNames: "content.bundle.js",
                format: "iife",
            },
        },
        emptyOutDir: false,
        outDir: "dist",
    },
});
