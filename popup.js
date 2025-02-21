document.addEventListener("DOMContentLoaded", () => {
  const scrapeBtn = document.getElementById("scrapeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const output = document.getElementById("output");

  const convertToCSV = (data) => {
    const headers = ["Name", "Job Title", "Company", "Location"];
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = [row.name, row.jobTitle, row.company, row.location];
      csvRows.push(values.join(","));
    });

    return csvRows.join("\n");
  };

  const downloadCSV = () => {
    chrome.storage.local.get(["scrapedData"], (result) => {
      const scrapedData = result.scrapedData || [];
      if (scrapedData.length === 0) {
        alert("No data to download!");
        return;
      }

      const csvData = convertToCSV(scrapedData);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const now = new Date();
      const formattedDate = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .split(".")[0]; // YYYY-MM-DD_HH-MM-SS
      const fileName = `scraped_data_${formattedDate}.csv`;

      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);

      // 🔥 Close the popup automatically after 500ms
      setTimeout(() => window.close(), 500);
    });
  };

  scrapeBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabs[0].id },
          files: ["content.js"],
        },
        () => {
          console.log("Content script injected");

          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "scrape" },
            (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error:", chrome.runtime.lastError.message);
                alert("Please refresh the page and try again.");
                return;
              }
              console.log("Scraping initiated:", response);
            }
          );
        }
      );
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrapedData") {
      console.log("Received Data:", message.data);
      output.innerText = JSON.stringify(message.data, null, 2);

      // 🔥 Clear old data before storing new values
      chrome.storage.local.set({ scrapedData: message.data }, () => {
        console.log("New Data Saved to Local Storage:", message.data);
      });
    }
  });

  downloadBtn.addEventListener("click", downloadCSV);
});
