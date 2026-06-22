import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const templatesDir = join(rootDir, "templates");
const assetsDir = join(templatesDir, "assets");
const astroScriptPattern = /\.astro_astro_type_script_index_\d+_lang/;
const textFileExtensions = new Set([".html", ".js"]);
const stableAssetNames = [
  { pattern: /^BaseHead\.[^.]+\.js$/, stableName: "theme-main.js" },
  { pattern: /^BaseHead\.[^.]+\.css$/, stableName: "theme-main.css" },
  { pattern: /^Header\.[^.]+\.css$/, stableName: "theme-header.css" },
];

function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir).flatMap((entry) => {
    const filePath = join(dir, entry);
    return statSync(filePath).isDirectory() ? walk(filePath) : [filePath];
  });
}

const renames = new Map();

// Pass 1: strip Astro internal script suffixes
for (const filePath of walk(assetsDir)) {
  const fileName = basename(filePath);

  if (extname(fileName) !== ".js" || !astroScriptPattern.test(fileName)) {
    continue;
  }

  const safeFileName = fileName.replace(astroScriptPattern, "");
  const safeFilePath = join(assetsDir, safeFileName);

  if (existsSync(safeFilePath)) {
    rmSync(safeFilePath);
  }

  renameSync(filePath, safeFilePath);
  renames.set(fileName, safeFileName);
}

// Pass 2: rename content-hashed assets to stable names
for (const filePath of walk(assetsDir)) {
  const fileName = basename(filePath);
  const stableAsset = stableAssetNames.find(({ pattern }) =>
    pattern.test(fileName),
  );

  if (!stableAsset) {
    continue;
  }

  const stableFilePath = join(assetsDir, stableAsset.stableName);

  if (existsSync(stableFilePath)) {
    rmSync(stableFilePath);
  }

  renameSync(filePath, stableFilePath);
  renames.set(fileName, stableAsset.stableName);
}

// Pass 3: update references in HTML and JS files
for (const filePath of walk(templatesDir)) {
  if (!textFileExtensions.has(extname(filePath))) {
    continue;
  }

  let content = readFileSync(filePath, "utf8");
  let nextContent = content;

  for (const [from, to] of renames) {
    nextContent = nextContent.split(from).join(to);
  }

  if (nextContent !== content) {
    writeFileSync(filePath, nextContent);
  }
}

// Verify no unsanitized references remain
const remaining = walk(templatesDir)
  .filter((filePath) => textFileExtensions.has(extname(filePath)))
  .filter((filePath) => {
    const fileName = basename(filePath);
    return (
      astroScriptPattern.test(fileName) ||
      astroScriptPattern.test(readFileSync(filePath, "utf8"))
    );
  });

if (remaining.length > 0) {
  throw new Error(
    `Found unsanitized Astro script asset references:\n${remaining.join("\n")}`,
  );
}

console.log(`Sanitized ${renames.size} Astro asset name(s).`);
