let isWhatsAppConnected = false;  // This variable will track the state of the connection
let progress = 0;  // This will track the progress percentage

// Function to handle connecting WhatsApp contacts in stages
async function handleWhatsAppConnection() {
    console.log("Button clicked for WhatsApp connection");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show the loading message
    let loadingMessage = document.getElementById('loadingMessage');
    loadingMessage.classList.remove('hidden');
    loadingMessage.classList.add('visible');

    let progressBar = document.querySelector('.progress-bar');
    let badge = document.querySelector('.badge');

    // Function to be injected into the WhatsApp page to fetch chat names
    function scrollAndFetchChats(type) {
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
                console.log(JSON.stringify(chatNames, null, 2));
                scrollToTop();
            }
        }

        function scrollToTop() {
            chatContainer.scrollTo({
                top: 0,
                behavior: 'auto'
            });
            chrome.runtime.sendMessage({ action: 'scrollCompleted', success: true });
        }

        const scrollTimer = setInterval(scrollAndFetch, scrollInterval);
    }

    // Inject the scrollAndFetchChats function into the WhatsApp page, initially for "All" chats
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollAndFetchChats,
        args: ['All']  // Initial fetch for 'All' chats
    });

    // Listen for the message from the content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'scrollCompleted' && message.success) {
            updateProgressAndNextStage();
        }
    });

    // Function to handle progress and update the button and progress bar
    function updateProgressAndNextStage() {
        // Hide loading message
        loadingMessage.classList.remove('visible');
        loadingMessage.classList.add('hidden');

        // Increment the progress bar and update text
        if (progress === 0) {
            // After "All" contacts are fetched
            progress = 25;
            progressBar.style.width = `${progress}%`;
            badge.classList.remove('text-bg-warning');
            badge.classList.add('text-bg-success');
            badge.innerHTML = 'Fetched All Contacts <i class="bi-check-circle"></i>';

            // Now fetch unread contacts
            simulateUnreadFetch();
        } else if (progress === 25) {
            // After "Unread" contacts are fetched
            progress = 50;
            progressBar.style.width = `${progress}%`;
            badge.innerHTML = 'Fetched Unread Contacts <i class="bi-check-circle"></i>';

            // Now fetch group contacts
            simulateGroupFetch();
        } else if (progress === 50) {
            // After "Group" contacts are fetched
            progress = 75;
            progressBar.style.width = `${progress}%`;
            badge.innerHTML = 'Fetched Group Contacts <i class="bi-check-circle"></i>';

            // Now switch back to all contacts
            simulateAllFetch();
        } else if (progress === 75) {
            // Final state
            progress = 100;
            progressBar.style.width = `${progress}%`;
            badge.innerHTML = 'Connection Finalized <i class="bi-check-circle"></i>';
            document.getElementById('activateAI').innerHTML = 'Connected <i class="bi-whatsapp"></i>';
        }
    }

    // Simulate fetching unread contacts
    function simulateUnreadFetch() {
        loadingMessage.classList.remove('hidden');
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrollAndFetchChats,
            args: ['Unread']  // Fetch unread contacts
        });
    }

    // Simulate fetching group contacts
    function simulateGroupFetch() {
        loadingMessage.classList.remove('hidden');
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrollAndFetchChats,
            args: ['Groups']  // Fetch group contacts
        });
    }

    // Simulate switching back to fetching all contacts after groups
    function simulateAllFetch() {
        loadingMessage.classList.remove('hidden');
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: scrollAndFetchChats,
            args: ['All']  // Switch back to all chats
        });
    }
}

// Add an event listener to handle the button click
document.getElementById('activateAI').addEventListener('click', async () => {
    await handleWhatsAppConnection();
});
