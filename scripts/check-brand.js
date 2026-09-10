import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const forbiddenBrand = ["Duo", "Libras"].join("");
const ignoredDirectories = new Set([".git", "dist", "node_modules"]);
const matches = [];

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const entryPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      scan(entryPath);
      continue;
    }

    if (entry.isFile() && readFileSync(entryPath).includes(forbiddenBrand)) {
      matches.push(relative(process.cwd(), entryPath));
    }
  }
}

scan(process.cwd());

if (matches.length > 0) {
  console.error(`Marca antiga encontrada em:\n${matches.join("\n")}`);
  process.exit(1);
}

console.log("Marca validada: LumiLibras.");
