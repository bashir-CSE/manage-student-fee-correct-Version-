// Background script for Student Fee Manager
chrome.runtime.onInstalled.addListener(function () {
  console.log("Student Fee Manager extension installed");

  // Initialize default values if they don't exist
  chrome.storage.local.get(
    [
      "totalAmount",
      "discountAmount",
      "vatAmount",
      "grandTotalAmount",
      "receivedAmount",
    ],
    function (result) {
      const defaultValues = {};

      if (!result.totalAmount) defaultValues.totalAmount = "0";
      if (!result.discountAmount) defaultValues.discountAmount = "0";
      if (!result.vatAmount) defaultValues.vatAmount = "0";
      if (!result.grandTotalAmount) defaultValues.grandTotalAmount = "0";
      if (!result.receivedAmount) defaultValues.receivedAmount = "0";

      if (Object.keys(defaultValues).length > 0) {
        chrome.storage.local.set(defaultValues);
      }
    }
  );
});

// Handle extension icon click
chrome.action.onClicked.addListener(function (tab) {
  // This will be handled by the popup, but we can add additional logic here if needed
  console.log("Extension icon clicked on tab:", tab.url);
});

// Listen for tab updates to handle page navigation
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === "complete" && tab.url) {
    // Inject content script if on relevant pages
    if (
      tab.url.includes("dispute-manage-student-fees") ||
      tab.url.includes("dispute-fees-edit")
    ) {
      chrome.scripting
        .executeScript({
          target: { tabId: tabId },
          files: ["content.js"],
        })
        .catch((err) => {
          console.log("Content script already injected or error:", err);
        });
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "log") {
    console.log("Content script log:", request.message);
  }

  sendResponse({ success: true });
});
