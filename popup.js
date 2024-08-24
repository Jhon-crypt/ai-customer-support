document.addEventListener('DOMContentLoaded', function () {
    const tabLinks = document.querySelectorAll('.nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');

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

    document.getElementById('fetchChats').addEventListener('click', () => {
        const contactName = document.getElementById('contactName').value;

        if (contactName) {
            showLoader(true);  // Show loader

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: openChatAndExtract,
                    args: [contactName]
                }, (results) => {
                    const chatMessages = results[0].result;
                    displayChats(chatMessages);
                    showLoader(false);  // Hide loader
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

function showLoader(show) {
    const loader = document.getElementById('loader');
    loader.style.display = show ? 'block' : 'none';
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

document.getElementById('simulateClickButton').addEventListener('click', () => {
    // Define the selector for elements with role="listitem"
    const selector = 'div[class="x10l6tqk xh8yej3 x1g42fcv"]';

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: (selector) => {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    elements.forEach(element => {
                        // Simulate a mouse click
                        const mouseEvent = new MouseEvent('mousedown', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        element.dispatchEvent(mouseEvent);
                        
                        const mouseUpEvent = new MouseEvent('mouseup', {
                            view: window,
                            bubbles: true,
                            cancelable: true
                        });
                        element.dispatchEvent(mouseUpEvent);

                        // Alert the content of each element
                        alert(element.textContent || element.value || "No content found");
                    });
                } else {
                    alert("No elements found with role='listitem'");
                }
            },
            args: [selector]
        });
    });
});


