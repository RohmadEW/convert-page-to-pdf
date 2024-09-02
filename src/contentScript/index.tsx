import "./index.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { RuntimeMessage } from "@/types/RuntimeMessage";
import { pageSizeWidthHeight } from "@/types/PageSize";
import Cropper from "cropperjs";

console.info("ContentScript is running");

// Get base 64 image from image element
export const getBase64Image = async (imgElement: HTMLImageElement) => {
  const src = imgElement.src;

  return await new Promise<string>((resolve, reject) => {
    if (src.startsWith("data:image/")) {
      // Image is already base64
      resolve(src);
    } else {
      // Send message to background script to get image as base64
      chrome.runtime.sendMessage(
        {
          message: RuntimeMessage.CONVERT_TO_PDF_DOWNLOAD_IMAGE,
          data: {
            srcUrl: src,
          },
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

// Replace all images with base64
async function replaceImagesWithBase64() {
  const images = document.querySelectorAll("img");
  for (let img of images) {
    await getBase64Image(img).then((base64: any) => {
      img.src = base64;
    });
  }
}

// Scroll to position
function scrollToPosition(position: number) {
  return new Promise<void>((resolve) => {
    window.scrollTo({
      top: position,
      behavior: "smooth",
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

// Scroll to bottom
function scrollToBottom() {
  return scrollToPosition(document.body.scrollHeight);
}

// Scroll to top
function scrollToTop() {
  return scrollToPosition(0);
}

const cropImage = async (
  img: HTMLImageElement,
  pageWidth: number,
  pageHeight: number,
  position: number
) => {
  return new Promise<string | null>((resolve) => {
    // Get window width and calculate the ratio based on img dimensions
    const imgWidth = img.naturalWidth;
    const imgHeight = img.naturalHeight;

    // Calculate image dimensions
    const ratio = imgWidth / pageWidth;
    const yPosition = position * pageHeight * ratio;

    // Create cropper instance
    const cropper = new Cropper(img, {
      viewMode: 1,
      aspectRatio: pageWidth / pageHeight,
      data: {
        y: yPosition,
        height: imgHeight,
        width: imgWidth,
      },
      ready: () => {
        const canvas = cropper.getCroppedCanvas({
          width: pageWidth * 3, // Increase resolution for better quality
          height: pageHeight * 3, // Increase resolution for better quality
        });
        cropper.destroy();
        resolve(canvas.toDataURL("image/png"));
      },
    });
  });
};

// Open modal to convert page to PDF
const modalConvertToPDF = async () => {
  if (document.getElementById("converter-pdf-modal")) {
    document.getElementById("converter-pdf-modal")?.remove();
  }

  await scrollToBottom();
  await scrollToTop();

  const title = document.title;

  // Create modal
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

  // Modal content
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
                <span id="converter-pdf-download-text">Download as PDF</span>
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
        <div style="padding: 10px;font-size: 12px;margin-top: 12px;background: #dddddd;font-style: italic;">
          This modal will disappear while PDF Download is in progress. Please wait until the download is complete. The modal will reappear after the download is complete.
        </div>
        <div style="font-size: 24px;font-weight: 700; text-align: center; margin-top: 18px;">${title}</div>
        <div id="converter-pdf-preparing" style="font-size: 18px; text-align: center;margin-top: 16px;margin-bottom: 12px">
          Preparing the resources. Please wait...
        </div>
      </div>
    `;

  // Append modal to body
  document.body.appendChild(modal);

  // Listener for print button click
  document
    .getElementById("converter-pdf-print")
    ?.addEventListener("click", () => {
      window.print();
    });

  // Listener for download button click
  document
    .getElementById("converter-pdf-download")
    ?.addEventListener("click", async () => {
      // Change download text
      const downloadText = document.getElementById(
        "converter-pdf-download-text"
      );
      if (downloadText) {
        downloadText.textContent = "Downloading...";
      }

      // Hide modal
      modal.style.display = "none";

      // Initiate page and PDF
      const pageSize = (
        document.getElementById("converter-pdf-page-size") as HTMLSelectElement
      ).value;
      const pdf = new jsPDF("p", "mm", pageSize);

      // Get width and height of page
      const getWidthHeight = pageSizeWidthHeight.find(
        (size) => size.title === pageSize
      );
      const pageWidth = getWidthHeight?.width ?? 210; // Set default to A4
      const pageHeight = getWidthHeight?.height ?? 297; // Set default to A4

      // Convert page to PDF
      html2canvas(document.getElementsByTagName("html")[0]).then(
        async (canvas) => {
          // Get ratio of page
          const ratioPage = pageHeight / pageWidth;
          const pageHeightOnCanvas = ratioPage * canvas.width;
          const countPages = Math.ceil(canvas.height / pageHeightOnCanvas);
          const canvasHeightShouldBe = countPages * pageHeightOnCanvas;

          // Create new canvas with height of all pages
          // Set height of new canvas to be equal to the height of all pages
          const newCanvas = document.createElement("canvas");
          newCanvas.width = canvas.width;
          newCanvas.height = canvasHeightShouldBe;

          const newCanvasContext = newCanvas.getContext("2d");
          // Set background color to white
          if (newCanvasContext) {
            newCanvasContext.fillStyle = "white";
            newCanvasContext.fillRect(0, 0, newCanvas.width, newCanvas.height);
            newCanvasContext.drawImage(canvas, 0, 0);
          }

          // Get base64 data of new canvas
          const imgData = newCanvas.toDataURL("image/png");

          // Show modal
          modal.style.display = "flex";

          const img = document.createElement("img");
          img.src = imgData;
          document.body.appendChild(img);

          img.onload = async () => {
            console.log("Image size in MB", {
              size: imgData.length / 1024 / 1024,
              height: img.height,
              width: img.width,
            });

            console.log("Canvas size", {
              height: canvas.height,
              width: canvas.width,
            });

            // Crop image if height is more than page height
            const imgHeight = (img.height * pageWidth) / img.width;
            let heightLeft = imgHeight;

            if (imgHeight <= pageHeight) {
              pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
            } else {
              let position = 0;

              // Crop image to multiple pages using cropperjs
              while (heightLeft > 0) {
                const croppedImg = await cropImage(
                  img,
                  pageWidth,
                  pageHeight,
                  position
                );
                if (croppedImg) {
                  pdf.addImage(croppedImg, "PNG", 0, 0, pageWidth, pageHeight);
                }

                position++;
                heightLeft -= pageHeight;

                if (heightLeft > 0) {
                  pdf.addPage();
                }
              }
            }

            const fileName = title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
            pdf.save(`${fileName}.pdf`);

            console.log("PDF Size (MB)", {
              size: pdf.output("blob").size / 1024 / 1024,
            });

            // document.body.removeChild(img);

            // Change download text
            if (downloadText) {
              downloadText.textContent = "Download as PDF";
            }
          };
        }
      );
    });

  // Listener for close button click
  document
    .getElementById("converter-pdf-close")
    ?.addEventListener("click", () => {
      modal.remove();
    });

  // Replace all images with base64
  await replaceImagesWithBase64();

  // Remove preparing message
  document.getElementById("converter-pdf-preparing")?.remove();
};

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === RuntimeMessage.CONVERT_TO_PDF_OPEN_MODAL) {
    modalConvertToPDF();
  }

  return true;
});
