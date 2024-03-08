console.log("Content script loaded");

const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as Element;
                    if (element.matches('[data-testid^="conversation-turn-"]')) {
                        handleConversationTurn(element);
                    }
                }
            });
        }
    });
});

// Function to start observing the target node
function startObserving() {
    const targetNode = document.querySelector('div.flex.flex-col.text-sm.pb-9');
    if (targetNode) {
        console.log("Target node found");
        observer.observe(targetNode, { childList: true, subtree: true });
    } else {
        console.warn("Target node not found. Retrying in 1 second...");
        setTimeout(startObserving, 1000);
    }
}

// Start observing the target node
startObserving();

function handleConversationTurn(turnElement: Element) {
    const messageElements = turnElement.querySelectorAll('[data-message-id]');
    messageElements.forEach(messageElement => {
        handleMessageNode(messageElement);
    });
}

function handleMessageNode(node: Element) {
    const authorRole = node.getAttribute('data-message-author-role');
    const messageId = node.getAttribute('data-message-id');

    let messageContent = '';
    if (authorRole === 'user') {
        const userMessageElement = node.querySelector('div');
        if (userMessageElement) {
            messageContent = userMessageElement.textContent?.trim() || '';
        }
    } else if (authorRole === 'assistant') {
        const assistantMessageElement = node.querySelector('div.markdown');
        if (assistantMessageElement) {
            messageContent = assistantMessageElement.innerHTML?.trim() || '';
        }
    }

    const messageData = {
        id: messageId,
        role: authorRole,
        content: messageContent,
    };

    console.log(messageData);
}