console.log("Content script loaded");

// Function to get text safely
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

        // 🔥 FIX: Using closest("tr") instead of a dynamic class
        const parentRow = profile.closest("tr");  

        const jobTitleElement = parentRow?.querySelector("div[data-anonymize='job-title']");
        const companyElement = parentRow?.querySelector("td.list-people-detail-header__account span[data-anonymize='company-name']");
        const locationElement = parentRow?.querySelector("td.list-people-detail-header__geography");

        // 🔥 Extracting profile link
        const profileLinkElement = profile.querySelector("a");
        const profileURL = profileLinkElement ? `https://www.linkedin.com${profileLinkElement.getAttribute("href")}` : "Not Found";

        scrapedData.push({
            name: getText(nameElement),
            jobTitle: getText(jobTitleElement),
            company: getText(companyElement),
            location: getText(locationElement),
            profileURL: profileURL, // 🔥 Adding profile URL
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
