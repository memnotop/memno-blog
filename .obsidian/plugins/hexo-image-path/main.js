const { Plugin } = require("obsidian");

const ATTACHMENT_DIR = "source/img";
const PUBLIC_PREFIX = "/img";

module.exports = class HexoImagePathPlugin extends Plugin {
  async onload() {
    this.registerEvent(
      this.app.workspace.on("editor-paste", (event, editor) => {
        this.handleImageEvent(event, editor);
      })
    );

    this.registerEvent(
      this.app.workspace.on("editor-drop", (event, editor) => {
        this.handleImageEvent(event, editor);
      })
    );
  }

  async handleImageEvent(event, editor) {
    const files = Array.from(event.clipboardData?.files || event.dataTransfer?.files || []);
    const images = files.filter((file) => file.type.startsWith("image/"));

    if (!images.length) return;

    event.preventDefault();
    event.stopPropagation();

    await this.ensureFolder(ATTACHMENT_DIR);

    const links = [];
    for (const image of images) {
      const fileName = await this.createFileName(image);
      const vaultPath = `${ATTACHMENT_DIR}/${fileName}`;
      await this.app.vault.adapter.writeBinary(vaultPath, await image.arrayBuffer());
      links.push(`![](${PUBLIC_PREFIX}/${encodeURI(fileName)})`);
    }

    editor.replaceSelection(links.join("\n"));
  }

  async ensureFolder(path) {
    const parts = path.split("/");
    let current = "";

    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!(await this.app.vault.adapter.exists(current))) {
        await this.app.vault.createFolder(current);
      }
    }
  }

  async createFileName(file) {
    const extension = this.getExtension(file);
    const timestamp = this.formatDate(new Date());
    let baseName = `image-${timestamp}`;
    let fileName = `${baseName}.${extension}`;
    let index = 1;

    while (await this.app.vault.adapter.exists(`${ATTACHMENT_DIR}/${fileName}`)) {
      fileName = `${baseName}-${index}.${extension}`;
      index += 1;
    }

    return fileName;
  }

  getExtension(file) {
    const fromName = file.name.split(".").pop();
    if (fromName && fromName !== file.name) return fromName.toLowerCase();

    const fromType = file.type.split("/").pop();
    if (fromType === "jpeg") return "jpg";
    return fromType || "png";
  }

  formatDate(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate()),
      "-",
      pad(date.getHours()),
      pad(date.getMinutes()),
      pad(date.getSeconds())
    ].join("");
  }
};
