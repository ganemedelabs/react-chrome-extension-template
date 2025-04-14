// See https://vitest.dev/config/ for more about configuration files.

import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "jsdom",
        globals: true,
    },
});
