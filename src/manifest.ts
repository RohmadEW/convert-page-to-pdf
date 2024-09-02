import { defineManifest } from "@crxjs/vite-plugin";
import packageData from "../package.json";

export default defineManifest({
  name: packageData.name,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: "img/logo-16.png",
    48: "img/logo-64.png",
    128: "img/logo-128.png",
  },
  action: {
    default_icon: "img/logo-64.png",
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/contentScript/index.tsx"],
    },
  ],
  permissions: ["activeTab", "scripting", "downloads"],
});
