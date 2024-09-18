let isWhatsAppConnected = false;  // This variable will track the state of the connection

// Function to handle connecting WhatsApp
async function handleWhatsAppConnection() {
    console.log("Button clicked for WhatsApp connection");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show the loading message
    let loadingMessage = document.getElementById('loadingMessage');
    console.log("Loading message element:", loadingMessage);
    loadingMessage.classList.remove('hidden');
    loadingMessage.classList.add('visible');

    let progressBar = document.querySelector('.progress-bar');
    let badge = document.querySelector('.badge');

    // Function to be injected into the WhatsApp page
    function scrollAndFetchChats() {
        const chatContainer = document.querySelector('#pane-side');
        let chatNames = [];
        const scrollAmount = 500;
        const scrollInterval = 200;

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
            let loadingMessage = document.getElementById('loadingMessage');
            console.log("Loading end element:", loadingMessage);
            chatContainer.scrollTo({
                top: 0,
                behavior: 'auto'
            });
            // Send a message back to the popup script indicating success
            chrome.runtime.sendMessage({ action: 'scrollCompleted', success: true });
        }

        const scrollTimer = setInterval(scrollAndFetch, scrollInterval);
    }

    // Inject the scrollAndFetchChats function into the WhatsApp page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollAndFetchChats,
    });

    // Listen for the message from the content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'scrollCompleted' && message.success) {
            console.log("Scroll to top completed successfully!");
            // Hide loading message
            loadingMessage.classList.remove('visible');
            loadingMessage.classList.add('hidden');

            // Increase progress bar to 100%
            progressBar.style.width = '100%';
            progressBar.classList.add('bg-success');

            // Change the badge to success
            badge.classList.remove('text-bg-warning');
            badge.classList.add('text-bg-success');
            badge.innerHTML = 'WhatsApp connected <i class="bi-check-circle"></i>';

            // Change the button text to "Connect your messages" after successful connection
            let connectButton = document.getElementById('activateAI');
            connectButton.innerHTML = 'Connect your messages <i class="bi-envelope"></i>';
            isWhatsAppConnected = true;  // Update the state
        }
    });
}

// Function to handle connecting messages
async function handleMessagesConnection() {
    console.log("Button clicked for Messages connection");
    // Add your logic for handling the messages connection here

    // For now, just update the button and progress bar for demonstration
    let loadingMessage = document.getElementById('loadingMessage');
    let progressBar = document.querySelector('.progress-bar');
    let badge = document.querySelector('.badge');
    
    progressBar.style.width = '100%';  // Adjust as needed
    badge.innerHTML = 'Messages connected <i class="bi-envelope-check"></i>';

    loadingMessage.classList.add('hidden');
}

// Add an event listener to handle the button click
document.getElementById('activateAI').addEventListener('click', async () => {
    if (isWhatsAppConnected) {
        await handleMessagesConnection();  // Handle messages connection after WhatsApp is connected
    } else {
        await handleWhatsAppConnection();  // Initially handle WhatsApp connection
    }
});
