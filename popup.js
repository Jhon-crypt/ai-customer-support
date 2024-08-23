document.addEventListener('DOMContentLoaded', function () {
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Event listeners for tabs
    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            tabLinks.forEach(link => link.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('show', 'active'));

            link.classList.add('active');
            const targetId = link.getAttribute('href');
            const targetPane = document.querySelector(targetId);
            targetPane.classList.add('show', 'active');
        });
    });

    // List all contacts when the button is clicked
    document.getElementById('listContactsButton').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: listContacts
            }, (results) => {
                const contacts = results[0].result;
                displayContacts(contacts);
            });
        });
    });

    // Fetch chats for a specific contact when button is clicked
    document.getElementById('fetchChats').addEventListener('click', () => {
        const contactName = document.getElementById('contactName').value;

        if (contactName) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: openChatAndExtract,
                    args: [contactName]
                }, (results) => {
                    const chatMessages = results[0].result;
                    displayChats(chatMessages);
                });
            });
        }
    });
});

function displayContacts(contacts) {
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = ''; 

    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-item', 'list-group-item'); 

        contactCard.textContent = contact;
        contactCard.addEventListener('click', () => {
            document.getElementById('contactName').value = contact;
            switchToTab('searchContact');
        });

        contactList.appendChild(contactCard);
    });
}

function switchToTab(tabId) {
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabLinks.forEach(link => link.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('show', 'active'));

    document.querySelector(`.nav-link[href="#${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('show', 'active');
}

function displayChats(messages) {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = ''; 

    messages.forEach((message, index) => {
        const messageBubble = document.createElement('div');
        const isOutgoing = index % 2 === 0;

        messageBubble.classList.add('chat-bubble', isOutgoing ? 'outgoing' : 'incoming');
        messageBubble.textContent = message;
        chatBox.appendChild(messageBubble);
    });
}

function listContacts() {
    const contactList = document.querySelectorAll("div[role='listitem']");
    const contacts = [];

    contactList.forEach(contact => {
        const nameElement = contact.querySelector("span[dir='auto']");
        if (nameElement) {
            contacts.push(nameElement.textContent);
        }
    });

    return contacts;
}

function openChatAndExtract(contactName) {
    function simulateMouseClick(element) {
        const mouseEvent = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(mouseEvent);
    }

    function extractMessages() {
        const messageContainers = document.querySelectorAll(".message-in, .message-out");
        const messages = [];

        messageContainers.forEach(container => {
            const messageTextElement = container.querySelector(".copyable-text");
            if (messageTextElement) {
                const messageText = messageTextElement.textContent || messageTextElement.innerText;
                messages.push(messageText);
            }
        });

        return messages;
    }

    const contactList = document.querySelectorAll("div[role='listitem']");
    for (const contact of contactList) {
        const nameElement = contact.querySelector("span[dir='auto']");
        if (nameElement && nameElement.textContent.trim().toLowerCase() === contactName.trim().toLowerCase()) {
            simulateMouseClick(contact);
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(extractMessages());
                }, 3000);
            });
        }
    }

    return ["Contact not found"];
}
