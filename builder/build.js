const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const {
  templateDir,
  outputDir
} = require("./config");

function cleanName(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function buildAPK({
  websiteUrl,
  photoPath,
  filename,
  appName
}) {
  if (!websiteUrl) {
    throw new Error(
      "URL Website Tidak Boleh Kosong"
    );
  }

  if (!photoPath) {
    throw new Error(
      "Hanya Menerima Foto Bukan URL"
    );
  }

  if (!filename || !filename.trim()) {
    throw new Error(
      "Nama File Tidak Boleh Kosong"
    );
  }

  if (!appName || !appName.trim()) {
    throw new Error(
      "Nama Aplikasi Tidak Boleh Kosong"
    );
  }

  const safeFilename = cleanName(filename);

  if (!safeFilename) {
    throw new Error(
      "Nama File Tidak Boleh Kosong"
    );
  }

  const workDir = path.join(
    outputDir,
    `${Date.now()}-${safeFilename}`
  );

  fs.mkdirSync(workDir, {
    recursive: true
  });

  fs.cpSync(
    templateDir,
    workDir,
    {
      recursive: true
    }
  );

  /*
   * Nanti di sini:
   *
   * 1. websiteUrl dimasukkan ke WebView
   * 2. photoPath dijadikan icon APK
   * 3. appName dimasukkan ke strings.xml
   * 4. Gradle menjalankan build APK
   */

  const stringsFile = path.join(
    workDir,
    "app",
    "src",
    "main",
    "res",
    "values",
    "strings.xml"
  );

  let strings = fs.readFileSync(
    stringsFile,
    "utf8"
  );

  strings = strings
    .replace(
      "{{APP_NAME}}",
      appName.trim()
    )
    .replace(
      "{{WEBSITE_URL}}",
      websiteUrl.trim()
    );

  fs.writeFileSync(
    stringsFile,
    strings
  );

  const gradlew = path.join(
    workDir,
    process.platform === "win32"
      ? "gradlew.bat"
      : "gradlew"
  );

  execFileSync(
    gradlew,
    ["assembleRelease"],
    {
      cwd: workDir,
      stdio: "inherit"
    }
  );

  const apkSource = path.join(
    workDir,
    "app",
    "build",
    "outputs",
    "apk",
    "release",
    "app-release.apk"
  );

  const apkOutput = path.join(
    outputDir,
    `${safeFilename}.apk`
  );

  fs.copyFileSync(
    apkSource,
    apkOutput
  );

  return {
    filename: `${safeFilename}.apk`,
    path: apkOutput
  };
}

module.exports = {
  buildAPK
};
