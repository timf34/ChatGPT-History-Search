import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ConversationTurn {
    id: string;
    role: string;
    content: string;
}

interface Conversation {
    key: string;
    date?: Date;
    turns: ConversationTurn[];
}

class ChatGPTHistoryDB {
    private DB_NAME = 'ChatGPTHistoryDB';
    private DB_VERSION = 1;
    private STORE_NAME = 'conversations';

    async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = request.result;
                console.log('Database upgrade or initialization.');
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME, { keyPath: 'key' });
                    console.log(`Object store '${this.STORE_NAME}' created.`);
                }
            };

            request.onerror = (event) => {
                console.error('Database error:', request.error);
                reject(request.error);
            };

            request.onsuccess = (event) => {
                console.log('Database opened successfully.');
                resolve(request.result);
            };
        });
    }

    async initConversation(key: string) {
        const db = await this.openDB();
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        let request = store.get(key);
        let conversation: Conversation | undefined = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });

        if (!conversation) {
            // Explicitly defining conversation as a Conversation type here
            conversation = { key, date: new Date(), turns: [] };
            store.put(conversation);
        }
    }


    async saveConversationTurn(key: string, turn: ConversationTurn) {
        const db = await this.openDB();
        const transaction = db.transaction(this.STORE_NAME, 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);

        // Adjust the promise to allow for `null` or `Conversation`.
        let conversation: Conversation | null = await new Promise((resolve) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result as Conversation | null); // Explicit cast
            request.onerror = () => resolve(null); // This is now valid due to the adjusted promise type.
        });

        if (!conversation) {
            conversation = { key, date: new Date(), turns: [] };
        }
        conversation.turns.push(turn);

        store.put(conversation);
    }


    async searchConversations(keyword: string): Promise<Conversation[]> {
        const db = await this.openDB();
        const transaction = db.transaction(this.STORE_NAME, 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        const index = store.index('date');

        const conversations: Conversation[] = [];

        return new Promise((resolve) => {
            index.openCursor().onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
                if (cursor) {
                    const matchingTurns = cursor.value.turns.filter((turn: ConversationTurn) => turn.content.toLowerCase().includes(keyword.toLowerCase()));
                    if (matchingTurns.length > 0) {
                        conversations.push(cursor.value);
                    }
                    cursor.continue();
                } else {
                    resolve(conversations);
                }
            };
        });
    }

}

export default new ChatGPTHistoryDB();