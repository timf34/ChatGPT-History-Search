console.log("Service worker loaded");
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log('Tab update detected', tabId, changeInfo);
    console.log(tab.url);
    if (tab.url && tab.url.includes('chat.openai.com')) {
        console.log('ChatGPT URL detected:', tab.url);
    }
    if (changeInfo.url && changeInfo.url.includes('chat.openai.com/c/')) {
        console.log('New ChatGPT conversation detected:', changeInfo.url);
    }
});

