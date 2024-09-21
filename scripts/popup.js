let isWhatsAppConnected = false;  // This variable will track the state of the connection
let progress = 0;  // This will track the progress percentage

// Function to handle connecting WhatsApp contacts in stages
async function handleWhatsAppConnection() {
    console.log("Button clicked for WhatsApp connection");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    let loadingMessage = document.getElementById('loadingMessage');
    let progressBar = document.querySelector('.progress-bar');
    let badge = document.querySelector('.badge');
    let button = document.getElementById('activateAI');

    // Show the loading message
    if (progress === 0 || progress < 75) {
        loadingMessage.classList.remove('hidden');
        loadingMessage.classList.add('visible');
    }

    // Function to handle scrolling and fetching chats
    function scrollAndFetchChats(type) {
        // Function to store chat names in local storage
        function storeChatNames(type, chatNames) {
            // Storing chats by type into local storage
            localStorage.setItem(type, JSON.stringify(chatNames));
            //console.log(`Stored ${type} chat names:`, chatNames);
        }

        const chatContainer = document.querySelector('#pane-side');
        let chatNames = [];
        const scrollAmount = 500;
        const scrollInterval = 200;

        // Function to simulate clicks on the specified buttons
        function simulateClick(selectorText) {
            const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === selectorText);
            if (button) {
                button.click();
                console.log(`${selectorText} button clicked`);
            } else {
                console.log(`${selectorText} button not found`);
            }
        }

        // Simulate click on the appropriate button based on the chat type
        simulateClick(type);

        function fetchChatNames() {
            const chatElements = document.querySelectorAll('div[role="listitem"]');
            chatElements.forEach(chatElement => {
                const nameElement = chatElement.querySelector('span[title]');
                if (nameElement) {
                    const chatName = nameElement.getAttribute('title');
                    if (!chatNames.includes(chatName)) {
                        chatNames.push(chatName);
                    }
                }
            });
        }

        function scrollAndFetch() {
            const currentScrollPosition = chatContainer.scrollTop;
            const scrollHeight = chatContainer.scrollHeight;

            chatContainer.scrollBy(0, scrollAmount);
            fetchChatNames();

            if (currentScrollPosition + chatContainer.clientHeight >= scrollHeight) {
                clearInterval(scrollTimer);
                //console.log(JSON.stringify(chatNames, null, 2));
                // Store chat names in local storage
                storeChatNames(type, chatNames);
                scrollToTop();
            }
        }

        function scrollToTop() {
            chatContainer.scrollTo({
                top: 0,
                behavior: 'auto'
            });
            chrome.runtime.sendMessage({ action: 'scrollCompleted', success: true, type });
        }

        const scrollTimer = setInterval(scrollAndFetch, scrollInterval);
    }

    // Inject the scrollAndFetchChats function into the WhatsApp page, initially for "All" chats
    if (progress < 75) {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrollAndFetchChats,
            args: ['All']  // Initial fetch for 'All' chats
        });
    }

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'scrollCompleted' && message.success) {
            updateProgressAndNextStage(message.type);  // Pass the chat type to updateProgressAndNextStage
        }
    });

    // Function to handle progress and update the button and progress bar
    function updateProgressAndNextStage(chatType) {
        // Increment the progress bar and update text based on the type of chats fetched
        if (progress === 0 && chatType === 'All') {
            progress = 25;
            progressBar.style.width = `${progress}%`;
            badge.classList.remove('text-bg-warning');
            badge.classList.add('text-bg-success');
            badge.innerHTML = 'Fetched All Contacts <i class="bi-check-circle"></i>';
            simulateUnreadFetch();
        } else if (progress === 25 && chatType === 'Unread') {
            progress = 50;
            progressBar.style.width = `${progress}%`;
            badge.innerHTML = 'Fetched Unread Contacts <i class="bi-check-circle"></i>';
            simulateGroupFetch();
        } else if (progress === 50 && chatType === 'Groups') {
            progress = 75;
            progressBar.style.width = `${progress}%`;
            badge.innerHTML = 'Fetched Group Contacts <i class="bi-check-circle"></i>';
            // Now that groups have been fetched, process chat lists
            finalizeConnection();
        }
    }

    // Simulate fetching unread contacts
    function simulateUnreadFetch() {
        if (progress < 75) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrollAndFetchChats,
                args: ['Unread']  // Fetch unread contacts
            });
        }
    }

    // Simulate fetching group contacts
    function simulateGroupFetch() {
        if (progress < 75) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: scrollAndFetchChats,
                args: ['Groups']  // Fetch group contacts
            });
        }
    }


    // Finalize connection and update UI
    function finalizeConnection() {
        // Stop the loader
        loadingMessage.classList.remove('visible');
        loadingMessage.classList.add('hidden');

        // Set progress up to 75%
        progressBar.style.width = `${progress}%`;
        badge.innerHTML = 'Connection Finalized <i class="bi-check-circle"></i>';

        // Change button text to "Connect Your Chats"
        button.innerHTML = 'Connect Your Chats <i class="bi-chat-dots"></i>';
    }
}

// Function to handle connecting chats, no scrolling involved
async function handleConnectChats() {
    console.log("Button clicked for Connect Your Chats");
    let progressBar = document.querySelector('.progress-bar');
    let badge = document.querySelector('.badge');

    // Update progress bar to 100%
    progress = 100;
    progressBar.style.width = `${progress}%`;
    badge.innerHTML = 'All Chats Connected <i class="bi-check-circle"></i>';

    // Update button text to reflect final state
    document.getElementById('activateAI').innerHTML = 'All Chats Connected <i class="bi-whatsapp"></i>';

    // Stop the loader if visible
    let loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage.classList.contains('visible')) {
        loadingMessage.classList.remove('visible');
        loadingMessage.classList.add('hidden');
    }

    // Switch back to "All" chats without scrolling
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
            // Click on the "All" chats button without scrolling
            const button = Array.from(document.querySelectorAll('button')).find(el => el.textContent.trim() === 'All');
            if (button) {
                button.click();
                console.log('Switched back to All chats');

                // Retrieve stored chat names
                const allChats = JSON.parse(localStorage.getItem('All')) || [];
                const groupChats = JSON.parse(localStorage.getItem('Groups')) || [];

                console.log('All chats:', allChats);
                console.log('Group chats:', groupChats);

                // Remove group chats from all chats to get individual contacts
                const contacts = allChats.filter(chat => !groupChats.includes(chat));

                // Store the contacts in local storage
                localStorage.setItem('contacts', JSON.stringify(contacts));
                console.log('Stored contacts:', contacts);

            } else {
                console.log('All button not found');
            }
        }
    });
}

// Add an event listener to handle the button click
document.getElementById('activateAI').addEventListener('click', async () => {
    let buttonText = document.getElementById('activateAI').innerHTML.trim();
    if (buttonText === 'Connect Your Chats <i class="bi-chat-dots"></i>') {
        await handleConnectChats();  // Handle connect chats button
    } else {
        await handleWhatsAppConnection();  // Handle WhatsApp connection
    }
});
