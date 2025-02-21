chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "sendToServer") {
        fetch("http://localhost:5000/saveData", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profiles: request.data })
        })
        .then(response => response.json())
        .then(data => sendResponse({ success: true, serverResponse: data }))
        .catch(error => sendResponse({ success: false, error }));

        return true; // Keeps sendResponse open for async response
    }
});
