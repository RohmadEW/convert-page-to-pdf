import { RuntimeMessage } from "@/types/RuntimeMessage";

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === RuntimeMessage.CONVERT_TO_PDF_DOWNLOAD_IMAGE) {
    // Get the image as a blob
    fetch(request.data.srcUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result;
          sendResponse({ base64data });
        };
      });

    return true;
  }
});

// Listen for clicks on the extension icon
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id as number, {
    message: RuntimeMessage.CONVERT_TO_PDF_OPEN_MODAL,
  });
});
