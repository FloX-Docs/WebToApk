const path = require("path");

module.exports = {
  templateDir: path.join(
    __dirname,
    "..",
    "template"
  ),

  outputDir: path.join(
    __dirname,
    "..",
    "output"
  ),

  uploadDir: path.join(
    __dirname,
    "..",
    "uploads"
  )
};
