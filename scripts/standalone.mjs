// Export the playable milestone as one double-clickable HTML file.
import { build } from "vite";
import { readFile, writeFile } from "node:fs/promises";
const result = await build({
  logLevel: "error",
  base: "./",
  build: {
    write: false,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const output = (Array.isArray(result) ? result[0] : result).output;
const js = output
  .find((f) => f.type === "chunk" && f.isEntry)
  .code.replaceAll("</script", "<\\/script");
const css = output.find(
  (f) => f.type === "asset" && f.fileName.endsWith(".css"),
).source;
const shell = (await readFile("index.html", "utf8")).replace(
  "</head>",
  "<style>" + css + "</style></head>",
);
await writeFile(
  "dist/Battle-Master-II.html",
  shell.replace(
    /<script type="module" src="[^"]+"><\/script>/,
    () => '<script type="module">' + js + "</script>",
  ),
);
