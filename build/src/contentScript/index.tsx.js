import "/src/contentScript/index.css.js";
import jsPDF from "/vendor/.vite-deps-jspdf.js__v--66891bdb.js";
import html2canvas from "/vendor/.vite-deps-html2canvas.js__v--3805efd7.js";
import { RuntimeMessage } from "/src/types/RuntimeMessage.ts.js";
import { pageSizeWidthHeight } from "/src/types/PageSize.ts.js";
console.info("ContentScript is running");
export const getBase64Image = async (imgElement) => {
  const src = imgElement.src;
  return await new Promise((resolve, reject) => {
    if (src.startsWith("data:image/")) {
      resolve(src);
    } else {
      chrome.runtime.sendMessage(
        {
          message: RuntimeMessage.CONVERT_TO_PDF_DOWNLOAD_IMAGE,
          data: {
            srcUrl: src
          }
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response.base64data);
          }
        }
      );
    }
  });
};
async function replaceImagesWithBase64() {
  const images = document.querySelectorAll("img");
  for (let img of images) {
    await getBase64Image(img).then((base64) => {
      img.src = base64;
    });
  }
}
function scrollToPosition(position) {
  return new Promise((resolve) => {
    window.scrollTo({
      top: position,
      behavior: "smooth"
    });
    let lastScrollTop = window.pageYOffset;
    const checkScrollEnd = () => {
      if (Math.abs(window.pageYOffset - lastScrollTop) < 1) {
        window.removeEventListener("scroll", checkScrollEnd);
        setTimeout(() => {
          resolve();
        }, 750);
      } else {
        lastScrollTop = window.pageYOffset;
        requestAnimationFrame(checkScrollEnd);
      }
    };
    window.addEventListener("scroll", checkScrollEnd);
  });
}
function scrollToBottom() {
  return scrollToPosition(document.body.scrollHeight);
}
function scrollToTop() {
  return scrollToPosition(0);
}
const modalConvertToPDF = async () => {
  if (document.getElementById("converter-pdf-modal")) {
    document.getElementById("converter-pdf-modal")?.remove();
  }
  await scrollToBottom();
  await scrollToTop();
  const title = document.title;
  const modal = document.createElement("div");
  modal.id = "converter-pdf-modal";
  modal.style.position = "fixed";
  modal.style.top = "0";
  modal.style.left = "0";
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  modal.style.display = "flex";
  modal.style.justifyContent = "center";
  modal.style.alignItems = "center";
  modal.style.zIndex = "9999999999";
  modal.classList.add("no-print");
  modal.innerHTML = `
      <div style="background: white; padding: 20px; border-radius: 10px; width: 80%; overflow: auto;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div style="display: flex;gap: 8px;">
            <select id="converter-pdf-page-size" style="padding-left: 8px;padding-right: 8px;">
              <option value="a4" selected>A4</option>
              <option value="letter">Letter</option>
              <option value="legal">Legal</option>
            </select>
            <button id="converter-pdf-download" style="display: flex; align-items: center; background-color: #2196F3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 96 960 960" width="20" style="margin-right: 10px;"><path fill="white" d="M400 296v320L280 496l-56 56 216 216 216-216-56-56-120 120V296H400Zm-240 640V726h80v150h480V726h80v210H160Z"/></svg>
                Download PDF
            </button>
            <button id="converter-pdf-print" style="display: flex; align-items: center; background-color: #4CAF50; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 96 960 960" width="20" style="margin-right: 10px;"><path fill="white" d="M230 386V226h500v160h-70v-90H300v90h-70Zm-70 260v-100h640v100H160Zm470 270v-70H330v70H160V646h640v270H630ZM300 316v-90 90Zm160 470h40v-90h-40v90ZM130 926V616H60V476h190v-90h460v90h190v140h-70v310H630v100H330v-100H130Z"/></svg>
              Print
            </button>
          </div>
          <button id="converter-pdf-close" style="display: flex; align-items: center; background-color: #f44336; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 96 960 960" width="20" style="margin-right: 10px;"><path fill="white" d="M249 905 60 716q-9-9-9-21.5t9-21.5l189-189L60 294q-9-9-9-21.5t9-21.5L249 84q9-9 21.5-9t21.5 9l189 189 189-189q9-9 21.5-9t21.5 9l189 189q9 9 9 21.5t-9 21.5L679 484l189 189q9 9 9 21.5t-9 21.5L679 905q-9 9-21.5 9T636 905L447 716 258 905q-9 9-21.5 9T249 905Z"/></svg>
            Close
          </button>
        </div>
        <div style="font-size: 24px;font-weight: 700; text-align: center;">${title}</div>
        <div id="converter-pdf-preparing" style="font-size: 18px; text-align: center;margin-top: 18px;margin-bottom: 12px">
          Preparing to convert the page to PDF...
        </div>
      </div>
    `;
  document.body.appendChild(modal);
  document.getElementById("converter-pdf-print")?.addEventListener("click", () => {
    window.print();
  });
  document.getElementById("converter-pdf-download")?.addEventListener("click", async () => {
    modal.style.display = "none";
    html2canvas(document.getElementsByTagName("html")[0]).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pageSize = document.getElementById(
        "converter-pdf-page-size"
      ).value;
      const pdf = new jsPDF("p", "mm", pageSize);
      const getWidthHeight = pageSizeWidthHeight.find(
        (size) => size.title === pageSize
      );
      const imgWidth = getWidthHeight?.width ?? 210;
      const pageHeight = getWidthHeight?.height ?? 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      const fileName = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      pdf.save(`${fileName}.pdf`);
      modal.style.display = "flex";
    });
  });
  document.getElementById("converter-pdf-close")?.addEventListener("click", () => {
    modal.remove();
  });
  await replaceImagesWithBase64();
  document.getElementById("converter-pdf-preparing")?.remove();
};
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === RuntimeMessage.CONVERT_TO_PDF_OPEN_MODAL) {
    console.log("open modal");
    modalConvertToPDF();
  }
  return true;
});
