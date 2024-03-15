console.log("Content script loaded");

// Define a more specific type for the node that may be observed.
interface ElementWithMatch extends Element {
    matches(selector: string): boolean;
}

const observer = new MutationObserver((mutations: MutationRecord[]) => {
    mutations.forEach((mutation: MutationRecord) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node: Node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = node as ElementWithMatch;
                    if (element.matches('[data-testid^="conversation-turn-"]')) {
                        handleConversationTurn(element);
                    }
                }
            });
        }
    });
});

// Observes the target node for changes.
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

// Start observing the target node.
startObserving();

// Handles conversation turn elements by processing message elements within them.
function handleConversationTurn(turnElement: Element) {
    const messageElements = turnElement.querySelectorAll('[data-message-id]');
    messageElements.forEach((messageElement: Element) => {
        handleMessageNode(messageElement);
    });
}

// Processes each message node to log its details.
function handleMessageNode(node: Element) {
    const authorRole = node.getAttribute('data-message-author-role');
    const messageId = node.getAttribute('data-message-id');

    // Determines the content based on the author's role.
    const messageContent = getMessageContent(node, authorRole);

    logMessageData(messageId, authorRole, messageContent);
}

// Retrieves the message content based on the author's role.
function getMessageContent(node: Element, authorRole: string | null): string {
    if (authorRole === 'user') {
        return node.querySelector('div')?.textContent?.trim() || '';
    } else if (authorRole === 'assistant') {
        return node.querySelector('div.markdown')?.innerHTML?.trim() || '';
    }
    return '';
}

// Logs message data to the console.
function logMessageData(messageId: string | null, authorRole: string | null, messageContent: string) {
    const messageData = { id: messageId, role: authorRole, content: messageContent };
    console.log(messageData);
}
