
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

    // Existing Event Listeners
    document.getElementById('personalContactsButton').addEventListener('click', () => {
        handleButtonClick('All');
    });

    document.getElementById('groupContactsButton').addEventListener('click', () => {
        handleButtonClick('Groups');
    });

    document.getElementById('unreadContactsButton').addEventListener('click', () => {
        handleButtonClick('Unread');
    });

    document.getElementById('contactsButton').addEventListener('click', () => {
        logLocalStorageContacts();
    });

    document.getElementById('scrollContactsButtonUp').addEventListener('click', () => {
        scrollWhatsAppContacts('up');
    });

    document.getElementById('scrollContactsButtonDown').addEventListener('click', () => {
        scrollWhatsAppContacts('down');
    });

    function scrollWhatsAppContacts(direction) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: performScrollInWhatsApp,
                args: [direction]
            }, (results) => {
                const updatedContacts = results[0].result;
                displayContacts(updatedContacts);
            });
        });
    }

    function scrollWhatsAppContacts(direction) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                func: performScrollInWhatsApp,
                args: [direction]
            }, (results) => {
                const updatedContacts = results[0].result;
                displayContacts(updatedContacts);
            });
        });
    }

    function performScrollInWhatsApp(direction) {
        const chatContainer = document.querySelector('#pane-side');
        if (!chatContainer) {
            console.error('Chat container not found.');
            return [];
        }

        const scrollAmount = direction === 'up' ? -500 : 500;
        chatContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });

        const contactItems = chatContainer.querySelectorAll('.x10l6tqk.xh8yej3.x1g42fcv');
        const contactList = [];

        contactItems.forEach(item => {
            const titleElement = item.querySelector('span[title]');
            const title = titleElement ? titleElement.getAttribute('title') : 'Unknown';
            const imgElement = item.querySelector('img');
            const profilePicUrl = imgElement ? imgElement.src : '';

            contactList.push({ title, profilePicUrl });
        });

        return contactList;
    }

    function logLocalStorageContacts() {
        console.log("Filtering contacts with partial and full matches:");

        const allContactsString = localStorage.getItem('allContacts');
        const groupsString = localStorage.getItem('Groups');

        if (!allContactsString) {
            console.log("All Contacts: No data found");
            return;
        }

        const allContacts = JSON.parse(allContactsString);
        const groups = groupsString ? JSON.parse(groupsString) : [];

        // Filter out contacts where the contact title partially or fully matches any group title (case-insensitive)
        const filteredContacts = allContacts.filter(contact =>
            !groups.some(group =>
                contact.title.toLowerCase().includes(group.title.toLowerCase()) ||
                contact.title.toLowerCase() === group.title.toLowerCase()
            )
        );

        console.log("Filtered Contacts (excluding partially and fully matching groups):", filteredContacts);
        // Display the filtered contacts
        displayContacts(filteredContacts);
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
                    setTimeout(() => {
                        chrome.scripting.executeScript({
                            target: { tabId: tabs[0].id },
                            func: searchWhatsAppContacts,
                            args: [contactName]
                        }, () => {
                            // Add a delay before extracting chats
                            setTimeout(() => {
                                chrome.scripting.executeScript({
                                    target: { tabId: tabs[0].id },
                                    func: extractWhatsAppChats
                                }, (results) => {
                                    const messages = results[0].result;
                                    displayChats(messages);
                                    showLoader(false);
                                });
                            }, 100); // Adjust this delay as needed
                        });
                    }, 100);
                });
            });
        }
    });
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
    return new Promise((resolve) => {
        const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]');

        if (!searchInput) {
            console.error('Search input not found. Make sure you are on WhatsApp Web.');
            resolve();
            return;
        }

        searchInput.textContent = '';
        searchInput.focus();
        searchInput.click();

        const focusEvent = new FocusEvent('focus', { bubbles: true });
        const clickEvent = new MouseEvent('click', { bubbles: true });
        searchInput.dispatchEvent(focusEvent);
        searchInput.dispatchEvent(clickEvent);

        setTimeout(() => {
            document.execCommand('insertText', false, query);

            setTimeout(() => {
                const enterEvent = new KeyboardEvent('keydown', {
                    bubbles: true,
                    cancelable: true,
                    key: 'Enter',
                    keyCode: 13,
                    which: 13
                });
                searchInput.dispatchEvent(enterEvent);

                console.log(`Searching for: ${query}`);
                resolve();
            }, 400);
        }, 400);
    });
}

function extractWhatsAppChats() {
    const messageContainers = document.querySelectorAll('div[data-pre-plain-text]');
    const messages = [];

    messageContainers.forEach(container => {
        const messageText = container.querySelector('span.selectable-text');
        if (messageText) {
            const prePlainText = container.getAttribute('data-pre-plain-text');
            const timeMatch = prePlainText.match(/\[(.*?)\]/); // Extract the timestamp part
            const time = timeMatch ? timeMatch[1] : ''; // Get the time from the match
            const cleanedMessage = prePlainText.replace(/\[(.*?)\]\s*/, ''); // Remove the timestamp from the message

            const fullMessage = cleanedMessage + messageText.innerText;
            const messageType = fullMessage.includes('You: ') ? 'message-out' : 'message-in';

            messages.push({ text: fullMessage, type: messageType, time: time });
        }
    });

    return messages;
}


function handleButtonClick(buttonText) {
    showLoader(true);
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: simulateButtonClickByText,
            args: [buttonText]
        }, (results) => {
            let contactList = results[0].result;
            if (buttonText === 'All') {
                if (localStorage.getItem('allContacts')) {
                    // If the key exists, clear it and store new data
                    localStorage.removeItem('allContacts');
                    localStorage.setItem('allContacts', JSON.stringify(contactList));
                    console.log("Existing data cleared and new allContacts stored in local storage");
                } else {
                    // If the key doesn't exist, store directly
                    localStorage.setItem('allContacts', JSON.stringify(contactList));
                    console.log("New allContacts stored in local storage");
                }
            }
            if (buttonText === 'Groups') {
                if (localStorage.getItem('Groups')) {
                    // If the key exists, clear it and store new data
                    localStorage.removeItem('Groups');
                    localStorage.setItem('Groups', JSON.stringify(contactList));
                    console.log("Existing data cleared and new Groups stored in local storage");
                } else {
                    // If the key doesn't exist, store directly
                    localStorage.setItem('Groups', JSON.stringify(contactList));
                    console.log("New Groups stored in local storage");
                }
            }
            displayContacts(contactList);
            showLoader(false);
        });
    });
}

function displayContacts(contacts) {
    const container = document.querySelector('.contact');
    if (!container) {
        console.error('Contact container not found.');
        return;
    }
    container.innerHTML = '';

    contacts.forEach(contact => {
        const contactCard = document.createElement('div');
        contactCard.classList.add('contact-item');
        contactCard.innerHTML = `
            <img src="${contact.profilePicUrl || 'images/profile.webp'}" style="width:30px; height:30px; border-radius:50%; margin-right:10px;"/>
                <span>${contact.title || 'Unknown'}</span>
        `;

        contactCard.addEventListener('click', () => {
            const searchTabLink = document.getElementById('search-tab');
            const searchTabPane = document.getElementById('searchContact');
            const listTabLink = document.getElementById('list-tab');
            const listTabPane = document.getElementById('listContacts');

            listTabLink.classList.remove('active');
            listTabPane.classList.remove('show', 'active');

            searchTabLink.classList.add('active');
            searchTabPane.classList.add('show', 'active');

            document.getElementById('contactName').value = contact.title || 'Unknown';
        });

        container.appendChild(contactCard);
    });
}

function displayChats(messages) {
    const chatBox = document.getElementById('chatBox');
    if (!chatBox) {
        console.error('Chat box not found.');
        return;
    }
    chatBox.innerHTML = '';  // Clear previous chat history

    messages.forEach((messageObj) => {
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        // Apply 'message-in' or 'message-out' class based on the message type
        messageBubble.classList.add(messageObj.type);

        // Set the content of the message
        messageBubble.textContent = messageObj.text;
        chatBox.appendChild(messageBubble);
    });
}



function showLoader(show) {
    const loader = document.getElementById('loader');
    if (!loader) {
        console.error('Loader not found.');
        return;
    }
    loader.style.display = show ? 'block' : 'none';
}

function simulateButtonClickByText(buttonText) {
    return new Promise((resolve) => {
        console.log('Simulating button click for:', buttonText);

        const buttons = document.querySelectorAll('button');
        let selectedButton = null;

        buttons.forEach(button => {
            const buttonContent = button.textContent.trim();
            if (buttonContent === buttonText) {
                selectedButton = button;
            }
        });

        if (!selectedButton) {
            console.error(`Button with text "${buttonText}" not found`);
            return resolve([]);
        }

        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        selectedButton.dispatchEvent(clickEvent);

        setTimeout(() => {
            console.log('Attempting to extract contact list...');

            const contactItems = document.querySelectorAll('.x10l6tqk.xh8yej3.x1g42fcv');

            if (contactItems.length === 0) {
                console.log('No contact items found.');
                return resolve([]);
            }

            const contactList = [];

            contactItems.forEach(item => {
                const titleElement = item.querySelector('span[title]');
                const title = titleElement ? titleElement.getAttribute('title') : 'Unknown';

                // Detect if this contact is a group

                // Check for group icon or specific label
                const groupIcon = item.querySelector('img[alt="Group"]'); // Adjust selector as needed
                if (groupIcon) {
                }

                // Alternatively, check if the title contains "(Group)"
                if (title.endsWith('(Group)')) {
                }

                const imgElement = item.querySelector('img');
                const profilePicUrl = imgElement ? imgElement.src : '';

                contactList.push({ title, profilePicUrl });
            });

            resolve(contactList);
        }, 500); // Increased delay to ensure the contact list is fully loaded
    });
}
