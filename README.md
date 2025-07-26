# Student Fee Manager Chrome Extension

The **Student Fee Manager** is a powerful Chrome extension designed to automate the tedious process of updating student fee records. It intelligently identifies unpaid fee entries, opens them, fills in the details based on your saved template, and submits the form, saving you significant time and reducing manual errors.

<!-- It's recommended to add a GIF here showing the extension in action! -->
<!-- e.g., ![Demo GIF](demo.gif) -->

## Prerequisites

- Google Chrome browser

## Features

-   **Smart Automation**: Automatically scans a page to find all records marked as "unpaid".
-   **Batch Processing**: Opens each unpaid record in a new tab to be processed sequentially.
-   **Auto-Fill Forms**: Instantly fills fee details (Total, Discount, VAT, etc.) on the editing page using your saved values.
-   **Auto-Submit & Close**: Automatically submits the updated form and closes the tab, creating a seamless "fire-and-forget" workflow.
-   **Dynamic Calculation Popup**: An intuitive popup to set and save your fee template. It automatically calculates Total Amount, VAT, and Received Amount as you type the Grand Total.
-   **Real-time Feedback**: Provides status notifications directly on the web page and in the extension popup to keep you informed.
-   **Adaptable by Design**: Built with flexible selectors that can be easily modified to work with different website layouts.

## How It Works

The extension streamlines fee updates through a two-stage automated process:

1.  **Stage 1: Identification & Initiation (The "Manage Fees" Page)**
    -   You navigate to the main page that lists all student fee records.
    -   You click the **`Update Value`** button in the extension popup.
    -   The extension scans the page for all rows containing an "unpaid" status.
    -   For each unpaid record found, it programmatically clicks the "Edit" button, opening the fee-editing page in a new browser tab.
    -   To distinguish these tabs from manually opened ones, it adds a special `automated=true` parameter to the URL.

2.  **Stage 2: Execution & Completion (The "Edit Fee" Page)**
    -   In each newly opened tab, the extension's content script detects the `automated=true` URL parameter and activates.
    -   It waits for the page to fully load.
    -   It retrieves the fee details you saved in the popup (Total, Discount, etc.) and fills out the corresponding form fields.
    -   It then finds and clicks the "Update" or "Submit" button.
    -   After a brief delay to ensure the submission is successful, the tab automatically closes itself.

## Installation and Usage

1.  **Install the Extension**:
    - Clone or download this repository.
    - Open Chrome and navigate to `chrome://extensions/`.
    - Enable "Developer mode" in the top right corner.
    - Click **`Load unpacked`** and select the project directory.

2.  **Configure Fee Values**:
    - Click the Student Fee Manager icon in your Chrome toolbar to open the popup.
    - Enter the **Grand Total Amount** and **Discount Amount**. The other fields will be calculated and displayed for you in the blue box.
    - Click **`Save Values`** to store this template for the automation.

3.  **Start the Automation**:
    - Navigate to the web page that lists all the student fee records.
    - Open the extension popup and click the **`Update Value`** button.
    - Watch as the extension opens new tabs and processes the unpaid fees automatically.

4.  **Monitor the Process**:
    - Click the **`Check Status`** button in the popup to see if the automation is currently running.
    - On-page notifications will appear to inform you about form filling and submission status.

## For Developers & Customization

### File Structure

-   `manifest.json`: The extension's manifest file, defining its permissions, scripts, and other metadata.
-   `popup.html` / `popup.js`: The UI and logic for the extension's popup. This is where the user configures and saves the fee values.
-   `content.js`: The core content script that interacts with the target web pages. It handles finding unpaid rows, filling forms, and submitting them.
-   `background.js`: The service worker that runs in the background. It initializes default storage values and injects the content script into relevant pages.

### Key Logic in `content.js`

-   **`startAutomation()`**: Kicks off the process based on the current URL.
-   **`handleManageFeesPage()`**: Finds all unpaid rows using `findAllUnpaidRows()` and clicks their edit buttons.
-   **`handleEditFeesPage()`**: If the page was opened by the automation, it calls `autoFillForm()`.
-   **`autoFillForm()`**: Retrieves the saved values from `chrome.storage.local` and populates the form fields.
-   **`clickUpdateFeesButton()`**: Finds and clicks the submit button to finalize the update.

### How to Adapt for a Different Website

This extension is built to be adaptable. The CSS selectors used to find elements (like "unpaid" statuses, edit buttons, and form fields) are defined in `content.js`. These can be easily modified to work with different website layouts or structures without changing the core logic.

-   **To find unpaid rows**: Modify the logic inside `findAllUnpaidRows()`.
-   **To find the edit button**: Update the selectors array in `findEditButtonInRow()`.
-   **To fill form fields**: Adjust the selectors in the `fieldMappings` object inside `autoFillForm()`.
-   **To find the submit button**: Change the `buttonSelectors` array in `clickUpdateFeesButton()`.
