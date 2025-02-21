document.addEventListener("DOMContentLoaded", () => {
  const scrapeBtn = document.getElementById("scrapeBtn");
  const downloadBtn = document.getElementById("downloadBtn");
  const output = document.getElementById("output");

  const convertToCSV = (data) => {
    const headers = ["Name", "Job Title", "Company", "Location"];
    const csvRows = [headers.join(",")];

    data.forEach((row) => {
      const values = [row.name, row.jobTitle, row.company, row.location];
      csvRows.push(values.map((val) => `"${val}"`).join(",")); // Ensure proper CSV formatting
    });

    return csvRows.join("\n");
  };

  const downloadCSV = () => {
    chrome.storage.local.get(["scrapedData"], (result) => {
      let scrapedData = result.scrapedData || [];
      if (scrapedData.length === 0) {
        alert("No data to download!");
        return;
      }

      const csvData = convertToCSV(scrapedData);
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      const now = new Date();
      const formattedDate = now.toISOString().replace(/T/, "_").replace(/:/g, "-").split(".")[0];
      const fileName = `scraped_data_${formattedDate}.csv`;

      a.href = url;
      a.download = fileName;
      a.click();

      URL.revokeObjectURL(url);

      // ✅ Clear local storage after download
      chrome.storage.local.remove("scrapedData", () => {
        console.log("Local storage cleared after download.");
        output.innerText = "No data saved. Click 'Scrape Data' to start.";
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

          chrome.tabs.sendMessage(tabs[0].id, { action: "scrape" }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("Error:", chrome.runtime.lastError.message);
              alert("Please refresh the page and try again.");
              return;
            }
            console.log("Scraping initiated:", response);
          });
        }
      );
    });
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrapedData") {
      console.log("Received Data:", message.data);

      chrome.storage.local.get(["scrapedData"], (result) => {
        let oldData = result.scrapedData || [];

        // ✅ Ensure no duplicate entries using a Set
        const mergedData = [...oldData, ...message.data];
        const uniqueData = Array.from(new Map(mergedData.map((item) => [item.name, item])).values());

        chrome.storage.local.set({ scrapedData: uniqueData }, () => {
          console.log(`Updated Data Saved. Total Entries: ${uniqueData.length}`);
          output.innerText = `Total Data Saved: ${uniqueData.length}`;
        });
      });
    }
  });

  // ✅ Show existing count when opening the popup
  chrome.storage.local.get(["scrapedData"], (result) => {
    const savedData = result.scrapedData || [];
    output.innerText = `Total Data Saved: ${savedData.length}`;
  });

  downloadBtn.addEventListener("click", downloadCSV);
});
