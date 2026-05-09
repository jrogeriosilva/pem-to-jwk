/**
 * Checks that the total gzipped size of all JS chunks in dist/assets/ is below
 * BUNDLE_BUDGET_KB. Run after `npm run build`. Exits with code 1 on failure so
 * CI catches budget regressions.
 */
import { readdirSync, readFileSync } from "fs"
import { createGzip } from "zlib"
import { pipeline } from "stream/promises"
import { Readable, Writable } from "stream"
import { join } from "path"

const BUNDLE_BUDGET_KB = 200 // gzipped JS budget in KB

async function gzipSize(filePath) {
  const input = Readable.from(readFileSync(filePath))
  let size = 0
  const counter = new Writable({
    write(chunk, _enc, cb) {
      size += chunk.length
      cb()
    },
  })
  await pipeline(input, createGzip(), counter)
  return size
}

const assetsDir = new URL("../dist/assets", import.meta.url).pathname
const jsFiles = readdirSync(assetsDir)
  .filter((f) => f.endsWith(".js"))
  .map((f) => join(assetsDir, f))

if (jsFiles.length === 0) {
  console.error("No JS files found in dist/assets — run `npm run build` first.")
  process.exit(1)
}

let totalBytes = 0
for (const file of jsFiles) {
  const gz = await gzipSize(file)
  totalBytes += gz
  console.log(`  ${file.split("/").pop()}: ${(gz / 1024).toFixed(1)} KB gzipped`)
}

const totalKB = totalBytes / 1024
const passed = totalKB <= BUNDLE_BUDGET_KB

console.log(
  `\nTotal gzipped JS: ${totalKB.toFixed(1)} KB / ${BUNDLE_BUDGET_KB} KB budget → ${passed ? "✓ PASS" : "✗ FAIL"}`,
)

if (!passed) {
  console.error(
    `Bundle budget exceeded by ${(totalKB - BUNDLE_BUDGET_KB).toFixed(1)} KB. ` +
      "Run ANALYZE=true npm run build to inspect.",
  )
  process.exit(1)
}
