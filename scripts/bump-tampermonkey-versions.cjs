const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const getRepoRoot = () =>
  execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();

const getStagedFiles = () => {
  const output = execSync(
    "git diff --cached --name-only -z --diff-filter=ACMR",
    {
      encoding: "utf8",
    },
  );

  return output.split("\0").filter(Boolean);
};

const bumpVersion = (content) => {
  const versionRegex = /@version\s+(.+)/;
  const match = content.match(versionRegex);

  if (!match) {
    return { updated: false, content, reason: "missing @version" };
  }

  const currentVersion = match[1].trim();
  const today = new Date().toISOString().split("T")[0];

  const dashedMatch = currentVersion.match(/^(\d{4}-\d{2}-\d{2})_(\d+)$/);

  let seqWidth = 3;
  let seqNum = 1;

  if (dashedMatch) {
    seqWidth = dashedMatch[2].length;
    if (dashedMatch[1] === today) {
      seqNum = parseInt(dashedMatch[2], 10) + 1;
    }
  }

  const newSeq = String(seqNum).padStart(seqWidth, "0");
  const newVersion = `${today}_${newSeq}`;

  if (newVersion === currentVersion) {
    return {
      updated: false,
      content,
      reason: "version already current",
      currentVersion,
      newVersion,
    };
  }

  return {
    updated: true,
    content: content.replace(versionRegex, `@version      ${newVersion}`),
    currentVersion,
    newVersion,
  };
};

const bumpFile = (repoRoot, filePath) => {
  const absPath = path.resolve(repoRoot, filePath);

  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    return { updated: false, reason: "not a file" };
  }

  const content = fs.readFileSync(absPath, "utf8");
  if (!content.includes("@version")) {
    return { updated: false, reason: "no @version token" };
  }

  const result = bumpVersion(content);
  if (!result.updated) {
    return result;
  }

  fs.writeFileSync(absPath, result.content, "utf8");
  return result;
};

const isTypeScriptFile = (filePath) => /\.tsx?$/i.test(filePath);

const repoRoot = getRepoRoot();
const stagedFiles = getStagedFiles();
const bumpedFiles = [];

console.log(`[bump] staged (${stagedFiles.length}): ${stagedFiles.join(", ")}`);

for (const file of stagedFiles) {
  if (!isTypeScriptFile(file)) {
    console.log(`[bump] skip: ${file} (not .ts/.tsx)`);
    continue;
  }
  console.log(`[bump] check: ${file}`);
  const result = bumpFile(repoRoot, file);
  if (result.updated) {
    console.log(
      `[bump] updated: ${file} ${result.currentVersion} -> ${result.newVersion}`,
    );
    bumpedFiles.push(file);
    continue;
  }
  if (result.currentVersion && result.newVersion) {
    console.log(
      `[bump] unchanged: ${file} ${result.currentVersion} -> ${result.newVersion} (${result.reason})`,
    );
    continue;
  }
  console.log(`[bump] unchanged: ${file} (${result.reason})`);
}

if (bumpedFiles.length > 0) {
  console.log(`[bump] staging ${bumpedFiles.length} bumped .ts/.tsx files`);
  spawnSync("git", ["add", "--", ...bumpedFiles], { stdio: "inherit" });
}

// Run build to compile TypeScript to JavaScript
console.log("[bump] running pnpm build...");
const buildResult = spawnSync("pnpm", ["build"], { stdio: "inherit" });
if (buildResult.status !== 0) {
  console.error("[bump] build failed");
  process.exit(1);
}

// Stage corresponding .js files for bumped .ts/.tsx files
if (bumpedFiles.length > 0) {
  const jsFiles = bumpedFiles.map((f) => f.replace(/\.tsx?$/, ".js"));
  const existingJsFiles = jsFiles.filter((f) =>
    fs.existsSync(path.resolve(repoRoot, f)),
  );

  if (existingJsFiles.length > 0) {
    console.log(
      `[bump] staging ${existingJsFiles.length} compiled .js files: ${existingJsFiles.join(", ")}`,
    );
    spawnSync("git", ["add", "--", ...existingJsFiles], { stdio: "inherit" });
  } else {
    console.log("[bump] no compiled .js files to stage");
  }
}
