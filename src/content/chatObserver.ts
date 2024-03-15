import ChatGPTHistoryDB from '../database/database';

console.log("Content script loaded");
let currentConversationKey = '';

function getConversationKeyFromURL() {
    const url = window.location.href;
    const match = url.match(/chat.openai.com\/c\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
}

async function initOrUpdateConversationKey() {
    const conversationKey = getConversationKeyFromURL();
    if (conversationKey) {
        currentConversationKey = conversationKey;
        console.log('Current Conversation Key:', currentConversationKey);
        // Initialize or update any necessary data with the new conversation key here.
    } else {
        console.warn('No conversation key found in URL.');
    }
}

initOrUpdateConversationKey();

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

async function init() {
    try {
        await ChatGPTHistoryDB.openDB();
        console.log('Database initialized successfully.');
        startObserving();
    } catch (error) {
        console.error('Failed to initialize the database:', error);
    }
}

init();

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

startObserving();

function handleConversationTurn(turnElement: Element) {
    const messageElements = turnElement.querySelectorAll('[data-message-id]');
    messageElements.forEach((messageElement: Element) => {
        handleMessageNode(messageElement);
    });
}

// Modified to handle the assistant's response streaming.
function handleMessageNode(node: Element) {
    const authorRole = node.getAttribute('data-message-author-role');
    const messageId = node.getAttribute('data-message-id');
    if (authorRole === 'assistant') {
        setTimeout(() => {
            const innerDiv = node.querySelector('div');
            console.log('Node:', node);
            console.log('Inner div:', innerDiv);
            if (innerDiv) {
                // Wait for the streaming to finish for the assistant's response.
                waitForStreamingToEnd(innerDiv).then((content) => {
                    logMessageData(messageId, authorRole, content);
                });
            } else {
                console.warn('Inner div not found for assistant message:', node);
            }
        }, 1000);
    } else {
        // Handle user messages immediately.
        const messageContent = node.querySelector('div')?.textContent?.trim() || '';
        logMessageData(messageId, authorRole, messageContent);
    }
}

function waitForStreamingToEnd(node: Element): Promise<string> {
    return new Promise((resolve) => {
        console.log(`Waiting for streaming to end for message: ${node.getAttribute('data-message-id')}`);

        if (!node.classList.contains('result-streaming')) {
            console.log('Streaming already finished, resolving immediately');
            resolve(node.textContent?.trim() || '');
        } else {
            console.log('Streaming in progress, observing class attribute');

            const observer = new MutationObserver((mutations, obs) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        console.log('Class attribute changed');
                        console.log('Current classes:', node.classList);

                        if (!node.classList.contains('result-streaming')) {
                            console.log('Streaming finished, resolving promise');
                            observer.disconnect();
                            resolve(node.textContent?.trim() || '');
                        }
                    }
                });
            });

            observer.observe(node, { attributes: true, attributeFilter: ['class'] });
        }
    });
}

async function logMessageData(messageId: string | null, authorRole: string | null, messageContent: string) {
    // Use an empty string as a fallback if messageId or authorRole is null
    const messageData = {
        id: messageId ?? '', // Fallback to an empty string if messageId is null
        role: authorRole ?? '', // Fallback to an empty string if authorRole is null
        content: messageContent,
    };
    console.log('Saving message to DB:', messageData);
    // Use currentConversationKey as the key for the conversation entry
    await ChatGPTHistoryDB.saveConversationTurn(currentConversationKey, messageData);
}

