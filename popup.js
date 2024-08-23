document.addEventListener('DOMContentLoaded', function () {
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Event listeners for tabs
    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            
            // Remove active class from all links and tab panes
            tabLinks.forEach(link => link.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('show', 'active'));

            // Add active class to the clicked link and its corresponding pane
            link.classList.add('active');
            const targetId = link.getAttribute('href');
            const targetPane = document.querySelector(targetId);
            targetPane.classList.add('show', 'active');
        });
    });

    // List all contacts and automatically fetch their chats when the button is clicked
    document.getElementById('listContactsButton').addEventListener('click', () => {
        const storedContacts = JSON.parse(localStorage.getItem('contacts'));
        if (storedContacts && storedContacts.length > 0) {
            displayContacts(storedContacts);
            fetchChatsForAllContacts(storedContacts); // Automatically fetch chats
        } else {
            // Fetch contacts if not available in local storage
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: listContacts
                }, (results) => {
                    const contacts = results[0].result;
                    // Store contacts in local storage
                    localStorage.setItem('contacts', JSON.stringify(contacts));
                    displayContacts(contacts);
                    fetchChatsForAllContacts(contacts); // Automatically fetch chats
                });
            });
        }
    });

    // Dynamically fetch chats from organized local storage when a contact is clicked
    document.getElementById('contactList').addEventListener('click', (event) => {
        if (event.target && event.target.classList.contains('contact-item')) {
            const contactName = event.target.textContent.trim();
            displayChatsForContact(contactName);
        }
    });
});

// Function to display contacts in a styled list
function displayContacts(contacts) {
    const contactList = document.getElementById('contactList');
    contactList.innerHTML = ''; // Clear previous list

    contacts.forEach(contact => {
        // Create a card for each contact
        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-item', 'list-group-item'); // Using Bootstrap class

        contactCard.textContent = contact;
        contactList.appendChild(contactCard);
    });
}

// Function to fetch chats for all contacts and store them in organized local storage
function fetchChatsForAllContacts(contacts) {
    const storedChats = JSON.parse(localStorage.getItem('chats')) || {};

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        contacts.forEach(contact => {
            // Skip if chats already fetched and stored
            if (!storedChats[contact]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: openChatAndExtract,
                    args: [contact]
                }, (results) => {
                    const chatMessages = results[0].result;
                    storedChats[contact] = chatMessages;
                    localStorage.setItem('chats', JSON.stringify(storedChats));
                });
            }
        });
    });
}

// Function to fetch and display chats from local storage for a specific contact
function displayChatsForContact(contactName) {
    const storedChats = JSON.parse(localStorage.getItem('chats')) || {};

    if (storedChats[contactName]) {
        displayChats(storedChats[contactName]);
    } else {
        displayChats(["No chat messages found for this contact."]);
    }
}

// Function to display chat messages in WhatsApp-like bubbles
function displayChats(messages) {
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = ''; // Clear previous chat

    messages.forEach((message, index) => {
        const messageBubble = document.createElement('div');
        const isOutgoing = index % 2 === 0; // Alternate messages as outgoing/incoming

        messageBubble.classList.add('chat-bubble', isOutgoing ? 'outgoing' : 'incoming');
        messageBubble.textContent = message;
        chatBox.appendChild(messageBubble);
    });
}

// Content script functions to interact with the webpage
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
                }, 3000); // Adjust timeout if necessary
            });
        }
    }

    return ["Contact not found"];
}
