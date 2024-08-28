
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

    function initiateNewWhatsAppChat() {
        const keyboardEvent = new KeyboardEvent('keydown', {
            key: 'n',
            code: 'KeyN',
            which: 78,
            keyCode: 78,
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            altKey: true,
        });

        document.dispatchEvent(keyboardEvent);

        console.log('Initiated new WhatsApp chat shortcut (Ctrl + Alt + N)');
    }

    function searchWhatsAppContacts(query) {
        return new Promise((resolve, reject) => {
            const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]');

            if (!searchInput) {
                reject('Search input not found. Make sure you are on WhatsApp Web.');
                return;
            }

            searchInput.textContent = '';
            searchInput.focus();
            document.execCommand('insertText', false, query);

            const enterEvent = new KeyboardEvent('keydown', {
                bubbles: true,
                cancelable: true,
                keyCode: 13,
                which: 13
            });
            searchInput.dispatchEvent(enterEvent);

            // Wait for the search results to load
            setTimeout(() => {
                const contactItems = document.querySelectorAll('.x10l6tqk.xh8yej3.x1g42fcv');
                const foundContacts = Array.from(contactItems).map(item => {
                    const titleElement = item.querySelector('span[title]');
                    return titleElement ? titleElement.textContent.trim() : '';
                }).filter(Boolean);

                resolve(foundContacts);
            }, 1000); // Adjust the timeout as needed
        });
    }

    document.getElementById('fetchChats').addEventListener('click', () => {
        const contactName = document.getElementById('contactName').value;

        if (contactName) {
            showLoader(true);

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: initiateNewWhatsAppChat
                }, () => {
                    // After initiating new chat, search for the contact
                    chrome.scripting.executeScript({
                        target: { tabId: tabs[0].id },
                        func: searchWhatsAppContacts,
                        args: [contactName]
                    }, (results) => {
                        const foundContacts = results[0].result;
                        if (foundContacts.length > 0) {
                            alert(`Contacts found: ${foundContacts.join(', ')}`);
                        } else {
                            alert('No contacts found');
                        }
                        showLoader(false);
                    });
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
            //alert(JSON.stringify(contactList)); // Raw JSON alert
            displayContacts(contactList);
            showLoader(false);
        });
    });
}

function displayContacts(contacts) {
    const container = document.querySelector('.contact');
    if (!container) {
        alert('Contact container not found.');
        return;
    }
    container.innerHTML = '';

    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-item');
        contactCard.innerHTML = `
            <span><img src="logo/profile.webp" style="width:30px"/>${contact.title || 'Unknown'}</span><br>
        `;

        // Add click event listener for each contact
        contactCard.addEventListener('click', () => {
            // Switch to the second tab (Search Chats tab)
            const searchTabLink = document.getElementById('search-tab');
            const searchTabPane = document.getElementById('searchContact');
            const listTabLink = document.getElementById('list-tab');
            const listTabPane = document.getElementById('listContacts');

            listTabLink.classList.remove('active');
            listTabPane.classList.remove('show', 'active');

            searchTabLink.classList.add('active');
            searchTabPane.classList.add('show', 'active');

            // Set the contact name in the form
            document.getElementById('contactName').value = contact.title || 'Unknown';
        });

        container.appendChild(contactCard);
    });
}


function displayChats(messages) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) {
        alert('Chat box not found.');
        return;
    }
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
    if (!loader) {
        alert('Loader not found.');
        return;
    }
    loader.style.display = show ? 'block' : 'none';
}

function simulateButtonClickByText(buttonText) {
    return new Promise((resolve, reject) => {
        console.log('Simulating button click for:', buttonText); // Debugging log

        const buttons = document.querySelectorAll('button');
        let selectedButton = null;

        buttons.forEach(button => {
            const buttonContent = button.querySelector('div > div');
            if (buttonContent && buttonContent.textContent.trim() === buttonText) {
                selectedButton = button;
            }
        });

        if (!selectedButton) {
            alert(`Button with text "${buttonText}" not found`);

            return reject(new Error(`Button with text "${buttonText}" not found`));
        }

        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        selectedButton.dispatchEvent(clickEvent);

        // Extract contact list after a delay to ensure the contacts are rendered
        setTimeout(() => {
            console.log('Attempting to extract contact list...'); // Debugging log

            const contactItems = document.querySelectorAll('.x10l6tqk.xh8yej3.x1g42fcv');

            if (contactItems.length === 0) {
                alert('No contact items found.');
                console.log('No contact items found.');

                return resolve([]); // Resolve with an empty list if no items are found
            }

            const contactList = [];

            contactItems.forEach(item => {
                const titleElement = item.querySelector('span[title]');
                const timeElement = '';
                const messageElement = '';

                const title = titleElement ? titleElement.textContent.trim() : '';
                const time = timeElement ? timeElement.textContent.trim() : '';
                const message = messageElement ? messageElement.textContent.trim() : '';

                // Only add the contact if time and message are valid
                if (time !== 'No time' && message !== 'No message') {
                    contactList.push({ title, time, message });
                }
            });

            // Update the contact div with only titles
            const contactDiv = document.querySelector('.contact');
            if (contactDiv) {
                const titleSpan = contactDiv.querySelector('.title');
                const timeSpan = contactDiv.querySelector('.time');
                const messageSpan = contactDiv.querySelector('.message');

                titleSpan.innerHTML = contactList.map(contact => contact.title).join('<br>');
                timeSpan.innerHTML = contactList.map(contact => contact.time).join('<br>'); // Optional if you want to show time
                messageSpan.innerHTML = contactList.map(contact => contact.message).join('<br>'); // Optional if you want to show messages
            } else {
                console.log('Contact div not found.');
            }
            resolve(contactList);
        }, 100); // Delay might need adjustment depending on the app's response time
    });
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
        console.log('Extracting messages...'); // Debugging log
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
                const messages = extractMessages();
                //alert('Extracted Messages: ' + JSON.stringify(messages)); // Debugging alert
                resolve(messages);
            }, 3000);
        } else {
            alert('Contact not found');
            resolve(["Contact not found"]);
        }
    });
}
