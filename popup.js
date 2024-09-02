
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

    // New Event Listener for Contacts
    document.getElementById('contactsButton').addEventListener('click', () => {
        console.log("john")
        showLoader(true);
    
        // Simulate clicks on both "All" and "Groups" buttons at the same time
        Promise.all([
            simulateButtonClickByText('All'),
            simulateButtonClickByText('Groups')
        ]).then(([allContacts, groupContacts]) => {
            console.log('All Contacts:', allContacts);
            console.log('Group Contacts:', groupContacts);
    
            // Store "All" contacts in localStorage
            localStorage.setItem('allContacts', JSON.stringify(allContacts));
    
            // Store "Groups" contacts in localStorage
            localStorage.setItem('groupContacts', JSON.stringify(groupContacts));
    
            // Filter contacts that are in "All" but NOT in "Groups"
            const normalContacts = allContacts.filter(contact =>
                !groupContacts.some(groupContact => groupContact.title === contact.title)
            );
    
            console.log('Normal Contacts (Not in Groups):', normalContacts);
    
            // Store the filtered normal contacts in localStorage
            localStorage.setItem('normalContacts', JSON.stringify(normalContacts));
    
            // Display the filtered contacts
            displayContacts(normalContacts);
    
            // Optionally, also display all contacts
            displayContacts(allContacts, 'allContactsContainer');
    
            showLoader(false);
        }).catch(error => {
            console.error('Error fetching contacts:', error);
            showLoader(false);
        });
    });
    



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
            const fullMessage = prePlainText + messageText.innerText;
            messages.push(fullMessage);
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

            // If the Contacts button is clicked, filter out groups
            if (buttonText === 'Contacts') {
                contactList = contactList.filter(contact => !contact.isGroup);
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
            <span><img src="logo/profile.webp" style="width:30px"/>${contact.title || 'Unknown'}</span><br>
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
    chatBox.innerHTML = '';

    messages.forEach((message) => {
        const messageBubble = document.createElement('div');
        messageBubble.classList.add('chat-bubble');

        if (message.includes('] You: ')) {
            messageBubble.classList.add('outgoing');
        } else {
            messageBubble.classList.add('incoming');
        }

        messageBubble.textContent = message;
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
                let isGroup = false;

                // Example: Check for group icon or specific label
                // You need to adjust the selector based on WhatsApp Web's actual DOM structure
                // Common indicators might include the presence of a group icon or a "(Group)" suffix
                const groupIcon = item.querySelector('img[alt="Group"]'); // Adjust selector as needed
                if (groupIcon) {
                    isGroup = true;
                }

                // Alternatively, check if the title contains "(Group)"
                if (title.endsWith('(Group)')) {
                    isGroup = true;
                }

                contactList.push({ title, isGroup });
            });

            resolve(contactList);
        }, 500); // Increased delay to ensure the contact list is fully loaded
    });
}
