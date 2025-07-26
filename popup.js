// Popup script for Student Fee Manager
document.addEventListener("DOMContentLoaded", function () {
  const saveValuesBtn = document.getElementById("saveValues");
  const resetValuesBtn = document.getElementById("resetValues");
  const updateValueBtn = document.getElementById("updateValueButton");
  const checkStatusBtn = document.getElementById("checkStatus");
  const statusDiv = document.getElementById("status");

  // Load saved values on popup open
  loadSavedValues();

  // Save values to chrome storage
  saveValuesBtn.addEventListener("click", async () => {
    const values = {
      totalAmount: document.getElementById("totalAmount").value || "0",
      discountAmount: document.getElementById("discountAmount").value || "0",
      vatAmount: document.getElementById("vatAmount").value || "0",
      grandTotalAmount:
        document.getElementById("grandTotalAmount").value || "0",
      receivedAmount: document.getElementById("receivedAmount").value || "0",
    };

    await chrome.storage.local.set(values);
    showStatus("Values saved successfully!", "success");
  });

  // Reset values in chrome storage and input fields
  resetValuesBtn.addEventListener("click", async () => {
    const defaultValues = {
      totalAmount: "0",
      discountAmount: "0",
      vatAmount: "0",
      grandTotalAmount: "0",
      receivedAmount: "0",
    };

    await chrome.storage.local.set(defaultValues);
    document.getElementById("totalAmount").value = "";
    document.getElementById("discountAmount").value = "";
    document.getElementById("vatAmount").value = "";
    document.getElementById("grandTotalAmount").value = "";
    document.getElementById("receivedAmount").value = "";
    showStatus("Values reset successfully!", "info");
  });

  // Helper to send a message to the content script
  async function sendMessageToContentScript(action) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      showStatus("No active tab found.", "error");
      return;
    }

    try {
      // Ensure the content script is injected before sending a message.
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      const response = await chrome.tabs.sendMessage(tab.id, { action });
      if (response) {
        showStatus(response.message, response.success ? "success" : "error");
      }
    } catch (e) {
      console.error("Error sending message:", e);
      showStatus(
        "Could not connect to the page. Please refresh and try again.",
        "error"
      );
    }
  }

  // Start automation
  updateValueBtn.addEventListener("click", () => sendMessageToContentScript("startAutomation"));

  // Check status
  checkStatusBtn.addEventListener("click", () => sendMessageToContentScript("checkStatus"));

  async function loadSavedValues() {
    const result = await chrome.storage.local.get(
      [
        "totalAmount",
        "discountAmount",
        "vatAmount",
        "grandTotalAmount",
        "receivedAmount",
      ],
    );
    document.getElementById("totalAmount").value = result.totalAmount || "";
    document.getElementById("discountAmount").value = result.discountAmount || "";
    document.getElementById("vatAmount").value = result.vatAmount || "";
    document.getElementById("grandTotalAmount").value = result.grandTotalAmount || "";
    document.getElementById("receivedAmount").value = result.receivedAmount || "";
  }

  function showStatus(message, type) {
    statusDiv.className = "status " + type;
    statusDiv.textContent = message;
    statusDiv.style.display = "block";

    // Auto-hide after 5 seconds
    setTimeout(function () {
      statusDiv.style.display = "none";
    }, 5000);
  }

  // Update displayed calculation values and toggle visibility of calc div
  function updateDisplayedCalculations() {
    const grandTotalInput = document.getElementById("grandTotalAmount");
    const grandTotal = parseFloat(grandTotalInput.value) || 0;
    const discount =
      parseFloat(document.getElementById("discountAmount").value) || 0;
    const calcDiv = document.querySelector(".calc");

    if (grandTotal === 0 || grandTotalInput.value.trim() === "") {
      calcDiv.style.display = "none";
    } else {
      calcDiv.style.display = "block";
      const totalAmount = grandTotal / 1.15;
      const vatAmount = grandTotal - totalAmount;
      const receivedAmount = grandTotal - discount;

      document.getElementById(
        "displayTotalAmount"
      ).textContent = `Total Amount: ${totalAmount.toFixed(0)}`;
      document.getElementById(
        "displayVatAmount"
      ).textContent = `VAT Amount: ${vatAmount.toFixed(0)}`;
      document.getElementById(
        "displayDiscount"
      ).textContent = `Discount: ${discount.toFixed(0)}`;
      document.getElementById(
        "displayReceivedAmount"
      ).textContent = `Received Amount: ${receivedAmount.toFixed(0)}`;
    }
  }

  // Add event listeners for input changes to update displayed calculations
  document
    .getElementById("grandTotalAmount")
    .addEventListener("input", updateDisplayedCalculations);
  document
    .getElementById("discountAmount")
    .addEventListener("input", updateDisplayedCalculations);

  // Initial calculation update when popup opens
  updateDisplayedCalculations();
});
