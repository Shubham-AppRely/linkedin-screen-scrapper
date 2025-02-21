const getText = (element) => (element ? element.innerText.trim() : "Not Found");

// Function to scrape all user profiles
const scrapeData = () => {
    const userProfiles = document.querySelectorAll("div[aria-label='Lead Name']");

    if (userProfiles.length === 0) {
        console.error("No user profiles found.");
        return;
    }

    let scrapedData = [];

    userProfiles.forEach(profile => {
        const nameElement = profile.querySelector("a span");
        const jobTitleElement = profile.closest("tr")?.querySelector("div[data-anonymize='job-title']");

        const companyElement = profile.closest("tr").querySelector("td.list-people-detail-header__account span[data-anonymize='company-name']");
        const locationElement = profile.closest("tr").querySelector("td.list-people-detail-header__geography");

        scrapedData.push({
            name: getText(nameElement),
            jobTitle: getText(jobTitleElement),
            company: getText(companyElement),
            location: getText(locationElement),
        });
    });

    console.log("Scraped Data:", scrapedData);

    // Send data back to popup.js
    chrome.runtime.sendMessage({ action: "scrapedData", data: scrapedData });
};

// Ensure the script runs only after the DOM is fully loaded
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scrapeData);
} else {
    scrapeData();
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "scrape") {
        scrapeData();
        sendResponse({ status: "Scraping started" });
    }
});
