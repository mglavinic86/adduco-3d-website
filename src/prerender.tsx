import { renderToString } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import App from "./App";
const path = "dist/index.html";
writeFileSync(
  path,
  readFileSync(path, "utf8").replace(
    "<!--app-html-->",
    renderToString(<App />),
  ),
);
