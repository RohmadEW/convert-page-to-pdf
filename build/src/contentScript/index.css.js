import { createHotContext as __vite__createHotContext } from "/vendor/vite-client.js";import.meta.hot = __vite__createHotContext("/src/contentScript/index.css.js");import { updateStyle as __vite__updateStyle, removeStyle as __vite__removeStyle } from "/vendor/vite-client.js"
const __vite__id = "/Users/eko/Downloads/convert-page-to-pdf/src/contentScript/index.css"
const __vite__css = "\n@media print\n{    \n    .no-print, .no-print *\n    {\n        display: none !important;\n    }\n}"
__vite__updateStyle(__vite__id, __vite__css)
import.meta.hot.accept()
export default __vite__css
import.meta.hot.prune(() => __vite__removeStyle(__vite__id))