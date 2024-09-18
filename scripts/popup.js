document.getElementById('activateAI').addEventListener('click', async () => {
    console.log("Button clicked");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show the loading message
    let loadingMessage = document.getElementById('loadingMessage');
    console.log("Loading message element:", loadingMessage);
    loadingMessage.classList.remove('hidden');
    loadingMessage.classList.add('visible');
    //console.log("Loading message classes:", loadingMessage.classList);

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
        }
    });

});
