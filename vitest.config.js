const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { defineConfig } = require("vitest/config");

const qaEnvPath = path.resolve(__dirname, ".env.qa");
const safeClientEnvVars = ["REACT_APP_ENV", "REACT_APP_API_URL"];

if (fs.existsSync(qaEnvPath)) {
  const parsedQaEnv = dotenv.parse(fs.readFileSync(qaEnvPath));

  safeClientEnvVars.forEach((key) => {
    if (parsedQaEnv[key] && !process.env[key]) {
      process.env[key] = parsedQaEnv[key];
    }
  });
}

module.exports = defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup/setupTests.js"],
    include: ["tests/**/*.{test,spec}.{js,jsx}"],
    exclude: ["node_modules/**", "build/**", "playwright-E2E/**"],
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      exclude: ["node_modules/**", "build/**", "playwright-E2E/**", "tests/setup/**"],
    },
  },
});
