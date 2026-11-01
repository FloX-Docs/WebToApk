const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const {
  templateDir,
  workDir,
  outputDir
} = require("./config");

function cleanFilename(value) {

  return String(value || "")
    .trim()
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
}

function escapeXml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeJava(value) {

  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function copyDirectory(source, destination) {

  fs.cpSync(
    source,
    destination,
    {
      recursive: true
    }
  );
}

function replaceInFile(
  file,
  replacements
) {

  let content =
    fs.readFileSync(
      file,
      "utf8"
    );

  for (
    const [key, value]
    of Object.entries(replacements)
  ) {

    content =
      content.replaceAll(
        key,
        value
      );
  }

  fs.writeFileSync(
    file,
    content
  );
}

function prepareIcon(
  photoPath,
  projectDir
) {

  if (!photoPath) {
    return;
  }

  if (
    !fs.existsSync(photoPath)
  ) {
    throw new Error(
      "File foto tidak ditemukan"
    );
  }

  /*
   * Untuk tahap pertama kita simpan
   * foto sebagai resource drawable.
   *
   * Icon launcher bisa kita tingkatkan
   * ke adaptive icon pada tahap berikutnya.
   */

  const drawableDir =
    path.join(
      projectDir,
      "app",
      "src",
      "main",
      "res",
      "drawable"
    );

  fs.mkdirSync(
    drawableDir,
    {
      recursive: true
    }
  );

  fs.copyFileSync(
    photoPath,
    path.join(
      drawableDir,
      "flox_icon.png"
    )
  );
}

function buildAPK({
  websiteUrl,
  photoPath,
  filename,
  appName
}) {

  if (
    !websiteUrl ||
    !websiteUrl.trim()
  ) {

    throw new Error(
      "URL Website Tidak Boleh Kosong"
    );
  }

  if (!photoPath) {

    throw new Error(
      "Hanya Menerima Foto Bukan URL"
    );
  }

  if (
    !filename ||
    !filename.trim()
  ) {

    throw new Error(
      "Nama File Tidak Boleh Kosong"
    );
  }

  if (
    !appName ||
    !appName.trim()
  ) {

    throw new Error(
      "Nama Aplikasi Tidak Boleh Kosong"
    );
  }

  const safeFilename =
    cleanFilename(filename);

  if (!safeFilename) {

    throw new Error(
      "Nama File Tidak Boleh Kosong"
    );
  }

  fs.mkdirSync(
    workDir,
    {
      recursive: true
    }
  );

  fs.mkdirSync(
    outputDir,
    {
      recursive: true
    }
  );

  const id =
    crypto
      .randomBytes(8)
      .toString("hex");

  const projectDir =
    path.join(
      workDir,
      `${id}-${safeFilename}`
    );

  copyDirectory(
    templateDir,
    projectDir
  );

  const stringsFile =
    path.join(
      projectDir,
      "app",
      "src",
      "main",
      "res",
      "values",
      "strings.xml"
    );

  replaceInFile(
    stringsFile,
    {
      "{{APP_NAME}}":
        escapeXml(
          appName.trim()
        )
    }
  );

  const activityFile =
    path.join(
      projectDir,
      "app",
      "src",
      "main",
      "java",
      "com",
      "flox",
      "web2apk",
      "MainActivity.java"
    );

  replaceInFile(
    activityFile,
    {
      "{{WEBSITE_URL}}":
        escapeJava(
          websiteUrl.trim()
        )
    }
  );

  prepareIcon(
    photoPath,
    projectDir
  );

  const gradlew =
    path.join(
      projectDir,
      "gradlew"
    );

  if (
    !fs.existsSync(gradlew)
  ) {

    throw new Error(
      "gradlew tidak ditemukan di template"
    );
  }

  fs.chmodSync(
    gradlew,
    0o755
  );

  console.log(
    "Memulai Gradle build..."
  );

  execFileSync(
    gradlew,
    [
      "assembleRelease",
      "--no-daemon"
    ],
    {
      cwd: projectDir,
      stdio: "inherit"
    }
  );

  const generatedAPK =
    path.join(
      projectDir,
      "app",
      "build",
      "outputs",
      "apk",
      "release",
      "app-release.apk"
    );

  if (
    !fs.existsSync(generatedAPK)
  ) {

    throw new Error(
      "APK tidak berhasil dibuat"
    );
  }

  const finalAPK =
    path.join(
      outputDir,
      `${safeFilename}.apk`
    );

  fs.copyFileSync(
    generatedAPK,
    finalAPK
  );

  console.log(
    `APK berhasil dibuat: ${finalAPK}`
  );

  return {
    filename:
      `${safeFilename}.apk`,

    path:
      finalAPK
  };
}

module.exports = {
  buildAPK
};
