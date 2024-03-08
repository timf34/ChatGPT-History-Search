const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
            mutation.addedNodes.forEach((node: any) => {
                // Check if the node is a conversation turn
                if (node.nodeType === 1 && node.matches('[data-message-id]')) { // Adjust this selector based on precise criteria
                    handleMessageNode(node);
                }
            });
        }
    });
});

// Start observing
const targetNode = document.querySelector('div.flex.flex-col.text-sm.pb-9');
if (targetNode) {
    observer.observe(targetNode, { childList: true, subtree: true });
}

function handleMessageNode(node: Element) {
    const authorRole = node.getAttribute('data-message-author-role');
    const messageId = node.getAttribute('data-message-id');
    const messageContent = node.querySelector('div.markdown, div.text-message > div')?.innerHTML.trim(); // Adjust based on structure

    // You might want to structure this data differently depending on your storage solution
    const messageData = {
        id: messageId,
        role: authorRole,
        content: messageContent,
    };

    console.log(messageData);
}

console.log("Content script loaded");