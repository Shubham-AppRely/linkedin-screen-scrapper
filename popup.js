document.addEventListener("DOMContentLoaded", () => {
  const scrapeBtn = document.getElementById("scrapeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const clearBtn = document.getElementById("clearBtn");
  const fileNameInput = document.getElementById("fileName");
  const output = document.getElementById("output");

  const updateOutput = () => {
    chrome.storage.local.get(["scrapedData"], (result) => {
      const scrapedData = result.scrapedData || [];
      output.innerText =
        scrapedData.length > 0
          ? `Total Profiles Scraped: ${scrapedData.length}`
          : "Click 'Scrape Data' to get details.";
    });
  };

  const convertToCSV = (data) => {
    const headers = ["Name", "Job Title", "Company", "Location", "Profile URL"];
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
        const values = [
            `"${row.name.replace(/"/g, '""')}"`,        // Escape double quotes
            `"${row.jobTitle.replace(/"/g, '""')}"`,
            `"${row.company.replace(/"/g, '""')}"`,
            `"${row.location.replace(/"/g, '""')}"`,
            `"${row.profileURL.replace(/"/g, '""')}"`,
        ];
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

      const now = new Date();
      const formattedDate = now
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .split(".")[0]; // YYYY-MM-DD_HH-MM-SS

      // Get file name from input field
      const userFileName = fileNameInput.value.trim();
      const fileName = userFileName
        ? `${userFileName}-${formattedDate}.csv`
        : `scraped_data_${formattedDate}.csv`;

      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);

      // 🔥 Clear storage after download
      chrome.storage.local.remove("scrapedData", () => {
        console.log("Local storage cleared after download.");
        output.innerText = "Data cleared after download.";
      });

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

      // 🔥 Append new data instead of overwriting
      chrome.storage.local.get(["scrapedData"], (result) => {
        const existingData = result.scrapedData || [];
        const updatedData = [...existingData, ...message.data];

        chrome.storage.local.set({ scrapedData: updatedData }, () => {
          console.log(`New Total Data Count: ${updatedData.length}`);
          updateOutput();
        });
      });
    }
  });

  downloadBtn.addEventListener("click", downloadCSV);

  // 🔥 Clear Storage Button Functionality
  clearBtn.addEventListener("click", () => {
    chrome.storage.local.remove("scrapedData", () => {
      console.log("Local storage cleared manually.");
      updateOutput();
    });
  });

  // 🔥 Update UI immediately when popup opens
  updateOutput();
});
