const path = require("path");
const fs = require("fs");
const { parse } = require("dotenv");
const { execSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");

if (!fs.existsSync(envPath)) {
  console.error(".env.local not found at:", envPath);
  process.exit(1);
}

let content = fs.readFileSync(envPath, "utf8");
if (content.charCodeAt(0) === 0xfeff) {
  content = content.slice(1);
}
const parsed = parse(content);
for (const [key, value] of Object.entries(parsed)) {
  const normalizedKey = key.replace(/^\ufeff/, "");
  process.env[normalizedKey] = value;
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local. Check the file has a line: DATABASE_URL=postgresql://...");
  process.exit(1);
}

execSync("npx drizzle-kit migrate", { stdio: "inherit", cwd: root, env: process.env });
