document.getElementById('activateAI').addEventListener('click', async () => {
    console.log("Button clicked");
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show the loading message
    const loadingMessage = document.getElementById('loadingMessage');
    console.log("Loading message element:", loadingMessage);
    loadingMessage.classList.remove('hidden');
    loadingMessage.classList.add('visible');
    console.log("Loading message classes:", loadingMessage.classList);

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
            chatContainer.scrollTo({
                top: 0,
                behavior: 'auto'
            });
            console.log("Scrolled back to the top!");
            // Notify the popup script that scrolling is complete
            window.postMessage({ action: 'scrollCompleted' }, '*');
        }

        const scrollTimer = setInterval(scrollAndFetch, scrollInterval);
    }

    // Inject the scrollAndFetchChats function into the WhatsApp page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrollAndFetchChats,
    });

    // Listen for the message from the content script
    window.addEventListener('message', (event) => {
        if (event.data.action === 'scrollCompleted') {
            // Hide the loading message when scrolling is complete
            const loadingMessage = document.getElementById('loadingMessage');
            if (loadingMessage) {
                loadingMessage.classList.remove('visible');
                loadingMessage.classList.add('hidden');
                console.log("Loading message hidden.");
            }
        }
    });
});
