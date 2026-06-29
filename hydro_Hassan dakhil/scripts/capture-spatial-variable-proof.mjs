import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const outDir = path.join(__dirname, "..", "assets", "spatial-proof");
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });

  await page.goto("http://localhost:8089/spatial-variable-proof.html", {
    waitUntil: "networkidle",
  });
  await page.waitForSelector("body[data-ready='true']", { timeout: 60000 });

  const combined = path.join(outDir, "spatial-variable-selectors-proof.png");
  await page.screenshot({ path: combined, fullPage: true });
  console.log("Saved:", combined);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
