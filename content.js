// Content script for Student Fee Manager
(function () {
  // Prevent multiple executions
  if (window.studentFeeManagerLoaded) {
    return;
  }
  window.studentFeeManagerLoaded = true;

  let isAutomationRunning = false;
  let processedRows = new Set();

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    switch (request.action) {
      case "startAutomation":
        startAutomation();
        sendResponse({ success: true, message: "Automation started!" });
        break;
      case "stopAutomation":
        stopAutomation();
        sendResponse({ success: true, message: "Automation stopped!" });
        break;
      case "checkStatus":
        sendResponse({
          success: true,
          message: `Automation is ${
            isAutomationRunning ? "running" : "stopped"
          }`,
        });
        break;
    }
    return true; // Keep the message channel open for async responses
  });

  function startAutomation() {
    if (isAutomationRunning) {
      console.log("Automation already running");
      return;
    }

    isAutomationRunning = true;
    console.log("Starting automation...");

    // Check current page and handle accordingly
    if (window.location.href.includes("dispute-manage-student-fees")) {
      handleManageFeesPage();
    } else if (window.location.href.includes("dispute-fees-edit")) {
      handleEditFeesPage();
    } else {
      console.log("Not on a recognized page for automation");
      stopAutomation();
    }
  }

  function stopAutomation() {
    isAutomationRunning = false;
    console.log("Automation stopped");
  }

  function handleManageFeesPage() {
    console.log("Handling manage fees page...");
    const unpaidRows = findAllUnpaidRows();

    if (unpaidRows.length > 0) {
      console.log(`Found ${unpaidRows.length} unpaid rows. Clicking all edit buttons.`);
      unpaidRows.forEach((row) => {
        const editButton = findEditButtonInRow(row);
        if (editButton) {
          // Mark row visually before clicking
          markRowAsProcessed(row);
          // Append URL parameter to signal automation
          const url = new URL(editButton.href || window.location.href);
          url.searchParams.set("automated", "true");
          // Open in a new tab
          const newTab = window.open(url.href, "_blank");
          if (newTab) {
            console.log("Clicked edit button for an unpaid row.");
          } else {
            // Fallback for buttons that are not links
            editButton.click();
          }
        }
      });
    } else {
      console.log("No more unpaid rows found");
    }

    // Stop automation on this page after initiating clicks
    stopAutomation();
  }

  function findAllUnpaidRows() {
    const rows = document.querySelectorAll("tr");
    const unpaidRows = [];

    rows.forEach((row) => {
      if (processedRows.has(row)) return;

      const statusCell = Array.from(row.querySelectorAll("td")).find(
        (td) => td.textContent.trim().toLowerCase() === "unpaid"
      );

      if (statusCell) {
        unpaidRows.push(row);
        return;
      }

      const dangerBadge = row.querySelector(
        '.badge-danger, .text-danger, [style*="background-color: rgb(220, 53, 69)"]'
      );
      if (dangerBadge && dangerBadge.textContent.trim().toLowerCase() === "unpaid") {
        unpaidRows.push(row);
      }
    });

    return unpaidRows;
  }

  function findEditButtonInRow(row) {
    const selectors = [
      'a[href*="dispute-fees-edit"]',
      'button[onclick*="dispute-fees-edit"]',
      'button[style*="background-color: rgb(255, 193, 7)"]',
      '.btn-warning',
    ];

    for (const selector of selectors) {
      const button = row.querySelector(selector);
      if (button) return button;
    }
    return null;
  }

  function markRowAsProcessed(row) {
    processedRows.add(row);
    row.style.opacity = "0.6";
    row.style.backgroundColor = "#e9ecef";
  }

  function handleEditFeesPage() {
    console.log("Handling edit fees page...");
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("automated") === "true") {
      // Automatically trigger the form fill and submission process
      setTimeout(autoFillForm, 1500); // Delay to ensure page scripts have loaded
    } else {
      console.log("Not in automation mode. Manual edit.");
      stopAutomation();
    }
  }

  function autoFillForm() {
    console.log("Auto-filling form...");

    chrome.storage.local.get(
      [
        "totalAmount",
        "discountAmount",
        "vatAmount",
        "grandTotalAmount",
        "receivedAmount",
      ],
      function (result) {
        const fieldMappings = {
          totalAmount: ['input[name*="total"]', result.totalAmount],
          discountAmount: ['input[name*="discount"]', result.discountAmount],
          vatAmount: ['input[name*="vat"]', result.vatAmount],
          grandTotalAmount: ['input[name*="grand"]', result.grandTotalAmount],
          receivedAmount: ['input[name*="received"]', result.receivedAmount],
        };

        Object.entries(fieldMappings).forEach(
          ([fieldName, [selector, value]]) => {
            const field = document.querySelector(selector);
            if (field && value !== undefined) {
              field.value = value;
              field.dispatchEvent(new Event("input", { bubbles: true }));
              field.dispatchEvent(new Event("change", { bubbles: true }));
              console.log(`Filled ${fieldName}: ${value}`);
            } else {
              console.log(`Could not find field for ${fieldName}`);
            }
          }
        );

        showNotification("Form auto-filled. Submitting...", "success");
        setTimeout(clickUpdateFeesButton, 500);
      }
    );
  }

  function clickUpdateFeesButton() {
    const buttonSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:contains("Update")',
      'button:contains("Submit")',
      ".btn-primary",
    ];
    let updateButton = null;

    for (const selector of buttonSelectors) {
      try {
        updateButton = document.querySelector(selector);
        if (updateButton) break;
      } catch (e) {
        // Ignore invalid selectors
      }
    }

    if (updateButton) {
      console.log("Clicking Update Fees button");
      updateButton.click();
      showNotification("Form submitted successfully! This tab will close.", "success");
      // Close tab after a delay to ensure submission completes
      setTimeout(() => window.close(), 2000);
    } else {
      console.log("Could not find Update Fees button");
      showNotification("Could not find Update Fees button.", "error");
    }
  }

  function showNotification(message, type) {
    const notification = document.createElement("div");
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: ${type === "success" ? "#28a745" : "#dc3545"};
      color: white;
      padding: 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 16px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
      transition: opacity 0.5s;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = "0";
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 500);
    }, 3000);
  }

  // Initial check when the script loads
  if (document.readyState === "complete") {
    if (window.location.href.includes("dispute-fees-edit")) {
      handleEditFeesPage();
    }
  } else {
    window.addEventListener("load", () => {
      if (window.location.href.includes("dispute-fees-edit")) {
        handleEditFeesPage();
      }
    });
  }
})();
