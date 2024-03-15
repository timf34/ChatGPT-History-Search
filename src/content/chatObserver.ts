console.log("Content script loaded");

// Define a more specific type for the node that may be observed.
interface ElementWithMatch extends Element {
    matches(selector: string): boolean;
}

// Creates an observer instance that looks for new conversation turns (i.e. chat responses from the user or assistant).
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

// Target node: <div class="result-streaming markdown prose w-full break-words dark:prose-invert light">
// assistantTargetNode = document.querySelector('div.result-streaming.markdown.prose.w-full.break-words.dark\:prose-invert.light');
const assistantTargetNode = document.querySelector('div.markdown');
if (!assistantTargetNode) {
    console.warn("Assistant target node not found.");
}

const assistantConfig = { attributes: true, childList: false, subtree: false };

function assistantCallback(mutationsList: MutationRecord[], observer: MutationObserver) {
    // Check if the target node contains "result-streaming" class, if it does wait until it doesn't
    for (let mutation of mutationsList) {
        if (mutation.type === 'attributes') {
            if (assistantTargetNode) {
                console.log(assistantTargetNode.classList);
                if (assistantTargetNode.classList.contains('result-streaming')) {
                    console.log("Assistant is typing...");
                } else {
                    console.log("Assistant has stopped typing");
                    logMessageData(null, 'assistant', assistantTargetNode.innerHTML);
                }
            }
        }
    }
}

// Retrieves the message content based on the author's role.
function getMessageContent(node: Element, authorRole: string | null): string {
    if (authorRole === 'user') {
        return node.querySelector('div')?.textContent?.trim() || '';
    } else if (authorRole === 'assistant') {
        // return node.querySelector('div.markdown')?.innerHTML?.trim() || '';
        if (assistantTargetNode) {
            const assistantObserver = new MutationObserver(assistantCallback);
            assistantObserver.observe(assistantTargetNode, assistantConfig);
        }
    }
    return '';
}

// Logs message data to the console.
function logMessageData(messageId: string | null, authorRole: string | null, messageContent: string) {
    const messageData = { id: messageId, role: authorRole, content: messageContent };
    console.log(messageData);
}
