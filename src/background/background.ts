console.log("Service worker loaded");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && changeInfo.url.includes('chat.openai.com/c/')) {
        console.log('New ChatGPT conversation detected:', changeInfo.url);
    }
});

