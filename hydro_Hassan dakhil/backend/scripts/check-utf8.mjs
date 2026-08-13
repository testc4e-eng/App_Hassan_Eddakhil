import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const decoder = new TextDecoder("utf-8", { fatal: true });
const textExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".html", ".css", ".conf"]);
const mojibakePatterns = [
  { label: "misdecoded Latin-1 accent", regex: /\u00c3[\u0080-\u00bf]/u },
  { label: "misdecoded Latin-1 symbol", regex: /\u00c2[\u0080-\u00bf]/u },
  {
    label: "misdecoded smart punctuation",
    regex: /\u00e2\u20ac(?:[\u0098\u0099\u009c\u009d\u00a6\u0152\u0153\u2013\u2014\u2122])/u,
  },
  { label: "misdecoded emoji", regex: /\u00f0[\u0080-\u024f]{1,3}/u },
];

function shouldScan(filePath) {
  return textExtensions.has(path.extname(filePath).toLowerCase());
}

async function collectFiles(entryPath, files) {
  const entries = await readdir(entryPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "build") {
      continue;
    }

    const fullPath = path.join(entryPath, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath, files);
      continue;
    }

    if (shouldScan(fullPath)) {
      files.push(fullPath);
    }
  }
}

function relative(filePath) {
  return path.relative(appRoot, filePath).replaceAll("\\", "/");
}

function findMojibakeIssues(filePath, text) {
  const issues = [];
  const lines = text.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const matched = mojibakePatterns.find((entry) => entry.regex.test(line));
    if (!matched) continue;

    issues.push(`${relative(filePath)}:${index + 1} ${matched.label}`);
  }

  return issues;
}

async function main() {
  const files = [path.join(appRoot, "server.ts")];
  await collectFiles(path.join(appRoot, "src"), files);
  files.sort();

  const failures = [];

  for (const filePath of files) {
    const raw = await readFile(filePath);

    try {
      decoder.decode(raw);
    } catch (error) {
      failures.push(`${relative(filePath)} is not valid UTF-8 (${error instanceof Error ? error.message : String(error)})`);
      continue;
    }

    const text = raw.toString("utf8");
    failures.push(...findMojibakeIssues(filePath, text));
  }

  if (failures.length > 0) {
    console.error("UTF-8 check failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`UTF-8 check passed for ${files.length} files.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
