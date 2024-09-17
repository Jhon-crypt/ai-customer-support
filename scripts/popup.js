document.getElementById('activateAI').addEventListener('click', async () => {
    console.log("Button clicked"); // Add this line
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Show the loading message
    const loadingMessage = document.getElementById('loadingMessage');
    console.log("Loading message element:", loadingMessage); // Add this line
    loadingMessage.classList.remove('hidden');
    loadingMessage.classList.add('visible');
    console.log("Loading message classes:", loadingMessage.classList); // Add this line



    // Inject the script directly into the WhatsApp Web page
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: scrollAndFetchChats,
    }, () => {
        // Once the script is done, hide the loading message
        loadingMessage.classList.remove('visible');
        loadingMessage.classList.add('hidden');
        console.log("Loading message classes:", loadingMessage.classList); // Add this line



    });
});

// The function that will be injected and executed on the WhatsApp Web page
function scrollAndFetchChats() {
    // Select the chat container element
    const chatContainer = document.querySelector('#pane-side');

    // Create an array to store chat names
    let chatNames = [];

    // Scroll amount and interval
    const scrollAmount = 100; // Pixels to scroll by
    const scrollInterval = 500; // Time between scrolls (in milliseconds)

    // Function to get all visible chat names
    function fetchChatNames() {
        const chatElements = document.querySelectorAll('div[role="listitem"]');

        chatElements.forEach(chatElement => {
            const nameElement = chatElement.querySelector('span[title]');

            if (nameElement) {
                const chatName = nameElement.getAttribute('title');

                // Check if the chat name is not already in the array
                if (!chatNames.includes(chatName)) {
                    chatNames.push(chatName);
                }
            }
        });
    }

    // Function to scroll the chat container and fetch names
    function scrollAndFetch() {
        // Get current scroll position and height
        const currentScrollPosition = chatContainer.scrollTop;
        const scrollHeight = chatContainer.scrollHeight;

        // Scroll the chat container by the specified amount
        chatContainer.scrollBy(0, scrollAmount);

        // Fetch chat names after scrolling
        fetchChatNames();

        // Check if the scroll has reached the end
        if (currentScrollPosition + chatContainer.clientHeight >= scrollHeight) {
            // If reached the bottom, stop scrolling
            clearInterval(scrollTimer);

            // Output the chat names in JSON format
            console.log(JSON.stringify(chatNames, null, 2));

            // Move back to the top immediately
            scrollToTop();
        }
    }

    // Function to scroll back to the top as fast as possible
    function scrollToTop() {
        chatContainer.scrollTo({
            top: 0,
            behavior: 'auto' // Instant scrolling
        });

        console.log("Scrolled back to the top!");
    }

    // Set an interval to continuously scroll and fetch chat names
    const scrollTimer = setInterval(scrollAndFetch, scrollInterval);
}
