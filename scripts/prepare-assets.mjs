import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
await mkdir(`${root}public/duckdb`, { recursive: true });
for (const name of [
  "duckdb-mvp.wasm",
  "duckdb-eh.wasm",
  "duckdb-browser-mvp.worker.js",
  "duckdb-browser-eh.worker.js",
]) {
  await copyFile(
    `${root}node_modules/@duckdb/duckdb-wasm/dist/${name}`,
    `${root}public/duckdb/${name}`,
  );
}
console.log("DuckDB browser assets prepared locally.");
