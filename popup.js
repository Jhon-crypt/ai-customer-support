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

    document.getElementById('personalContactsButton').addEventListener('click', () => {
        handleButtonClick('All');
    });

    document.getElementById('groupContactsButton').addEventListener('click', () => {
        handleButtonClick('Groups');
    });

    document.getElementById('unreadContactsButton').addEventListener('click', () => {
        handleButtonClick('Unread');
    });

    document.getElementById('fetchChats').addEventListener('click', () => {
        const contactName = document.getElementById('contactName').value;

        if (contactName) {
            showLoader(true);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: openChatAndExtract,
                    args: [contactName]
                }, (results) => {
                    const chatMessages = results[0].result;
                    displayChats(chatMessages);
                    showLoader(false);
                });
            });
        }
    });
});

function handleButtonClick(buttonText) {
    showLoader(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: simulateButtonClickByText,
            args: [buttonText]
        }, (results) => {
            const contactList = results[0].result;
            displayContacts(contactList);
            showLoader(false);
        });
    });
}

function displayContacts(contacts) {
    const container = document.querySelector('#contactList');
    container.innerHTML = '';

    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-item');

        contactCard.innerHTML = `
            <strong>${contact.title || 'Unknown'}</strong><br>
            <small>${contact.time || 'No time'}</small><br>
            <p>${contact.message || 'No message'}</p>
        `;
        container.appendChild(contactCard);
    });
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

function simulateButtonClickByText(buttonText) {
    return new Promise((resolve, reject) => {
        const buttons = document.querySelectorAll('button');
        let selectedButton = null;

        buttons.forEach(button => {
            const buttonContent = button.querySelector('div > div');
            if (buttonContent && buttonContent.textContent.trim() === buttonText) {
                selectedButton = button;
            }
        });

        if (!selectedButton) {
            return reject(new Error(`Button with text "${buttonText}" not found`));
        }

        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        selectedButton.dispatchEvent(clickEvent);

        setTimeout(() => {
            const chatList = extractChatList();
            resolve(chatList);
        }, 1000);
    });
}

function extractChatList() {
    const chatItems = document.querySelectorAll('.contact-item');
    const chatList = [];

    chatItems.forEach(item => {
        const titleElement = item.querySelector('strong');
        const timeElement = item.querySelector('small');
        const messageElement = item.querySelector('p');

        const chatDetails = {
            title: titleElement ? titleElement.textContent.trim() : 'Unknown',
            time: timeElement ? timeElement.textContent.trim() : 'No time',
            message: messageElement ? messageElement.textContent.trim() : 'No message'
        };

        chatList.push(chatDetails);
    });

    return chatList;
}

function openChatAndExtract(contactName) {
    function simulateMouseClick(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window }));
            element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
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

    function findAndClickButton(buttonText) {
        const buttons = document.querySelectorAll('button');
        for (const button of buttons) {
            const buttonContent = button.querySelector('div > div');
            if (buttonContent && buttonContent.textContent.trim() === buttonText) {
                simulateMouseClick(button);
                return true;
            }
        }
        return false;
    }

    return new Promise((resolve) => {
        if (findAndClickButton('All') || findAndClickButton('Unread') || findAndClickButton('Groups')) {
            setTimeout(() => {
                resolve(extractMessages());
            }, 3000);
        } else {
            resolve(["Contact not found"]);
        }
    });
}
