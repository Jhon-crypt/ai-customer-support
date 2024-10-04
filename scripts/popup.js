let isWhatsAppConnected = false;  // This variable will track the state of the connection
let progress = 0;  // This will track the progress percentage

document.addEventListener('DOMContentLoaded', () => {
    async function onDomcontentLoaded() {

        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: checkIfConnected,
        });

        function checkIfConnected() {
            // Check if contacts, all, and unread data are in localStorage
            const contacts = localStorage.getItem('contacts');
            const allChats = localStorage.getItem('All');
            const unreadChats = localStorage.getItem('Unread');

            //Log statements to verify localStorage data
            console.log('contacts:', contacts);
            console.log('allChats:', allChats);
            console.log('unreadChats:', unreadChats);

            //alert("fecthed")
            if (contacts && allChats && unreadChats) {
                chrome.runtime.sendMessage({ action: 'connected', success: true });
            } else {
                chrome.runtime.sendMessage({ action: 'notconnected', success: false });
            }

        }
        console.log("Connect your Contacts button shown, business details button hidden.");


    }

    onDomcontentLoaded()


    chrome.runtime.onMessage.addListener((message) => {

        const button = document.getElementById('activateAI');
        let badge = document.querySelector('.badge');
        let progressBar = document.querySelector('.progress-bar');


        if (message.action === 'connected') {
            isWhatsAppConnected = true;
            button.innerHTML = 'Update buiness details <i class="bi-caret-down"></i>';
            progressBar.style.width = '100%';
            badge.classList.remove('text-bg-warning');
            badge.classList.add('text-bg-success');
            badge.innerHTML = 'Contacts synced <i class="bi-check-circle"></i>';
        } else if (message.action === 'notconnected') {
            isWhatsAppConnected = false;
            button.innerHTML = 'Connect your Contacts <i class="bi-people"></i>';
        }
    });

});


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
    document.getElementById('activateAI').innerHTML = 'Update buiness details <i class="bi-card-text"></i>';

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


async function uploadBuisnessDetails() {
    const formSection = document.getElementById('businessDetailsForm');

    // Toggle form visibility
    if (formSection.classList.contains('hidden')) {
        formSection.classList.remove('hidden');
        formSection.classList.add('visible');
    } else {
        formSection.classList.remove('visible');
        formSection.classList.add('hidden');
    }

    const form = document.getElementById('businessDetailsForm');
    const businessName = document.getElementById('businessName');
    const businessAbout = document.getElementById('businessAbout');

    // Load stored values (if available)
    const savedBusinessName = localStorage.getItem('businessName');
    const savedBusinessAbout = localStorage.getItem('businessAbout');

    if (savedBusinessName) businessName.value = savedBusinessName;
    if (savedBusinessAbout) businessAbout.value = savedBusinessAbout;

    // Handle form submission
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Prevent form submission

        // Save form data in localStorage
        localStorage.setItem('businessName', businessName.value);
        localStorage.setItem('businessAbout', businessAbout.value);

        formSection.classList.remove('visible');
        formSection.classList.add('hidden');


        const button = document.getElementById('activateAI');
        let badge = document.querySelector('.badge');

        button.innerHTML = 'Pick Contacts To AutoChat <i class="bi-whatsapp"></i>';
        badge.innerHTML = 'Buisness details updated <i class="bi-check-circle"></i>';

        //alert('Business details saved!');
    });

}

//

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updated') {

        const button = document.getElementById('activateAI');
        button.innerHTML = 'Contacts To AutoChat <i class="bi-whatsapp"></i>';


    }

});

//});

async function selectorContacts() {

    alert('select contatcts')
}

// Add an event listener to handle the button click
document.getElementById('activateAI').addEventListener('click', async () => {
    let buttonText = document.getElementById('activateAI').innerHTML.trim();
    if (buttonText.includes('Connect Your Chats')) {
        await handleConnectChats();  // Handle connect chats button
    } else if (buttonText.includes('Update buiness details')) {
        await uploadBuisnessDetails()
    } else if (buttonText.includes('Contacts To AutoChat')) {
        await selectorContacts()
    }
    else {
        await handleWhatsAppConnection();  // Handle WhatsApp connection
    }
});

// Handle hover events to show badge
document.querySelectorAll('.badge-container').forEach(function (element) {
    // Handle hover events to show badge and prevent it from hiding until mouse leaves both the icon and the badge itself
    const hoverBadge = document.getElementById('hover-badge');
    let isOverBadge = false; // Track if the mouse is over the badge itself

    // Function to show the badge
    function showBadge(badgeText) {
        hoverBadge.querySelector('span').textContent = badgeText;
        hoverBadge.classList.remove('d-none', 'hide-badge');
        hoverBadge.classList.add('show-badge');
    }

    // Function to hide the badge
    function hideBadge() {
        hoverBadge.classList.remove('show-badge');
        hoverBadge.classList.add('hide-badge');
        setTimeout(function () {
            if (!isOverBadge) {
                hoverBadge.classList.add('d-none');
            }
        }, 300); // Adjust this to match the transition duration
    }

    // Add hover event listeners to each icon
    document.querySelectorAll('.badge-container').forEach(function (element) {
        element.addEventListener('mouseenter', function () {
            const badgeText = element.getAttribute('data-badge');
            showBadge(badgeText);
        });

        element.addEventListener('mouseleave', function () {
            setTimeout(function () {
                if (!isOverBadge) { // Only hide the badge if not hovering over it
                    hideBadge();
                }
            }, 0);
        });
    });

    // Add hover event listeners to the badge itself
    hoverBadge.addEventListener('mouseenter', function () {
        isOverBadge = true; // Mouse is over the badge, don't hide it
    });

    hoverBadge.addEventListener('mouseleave', function () {
        isOverBadge = false; // Mouse left the badge, now it's okay to hide
        hideBadge();
    });

});

document.getElementById("toggleButton").addEventListener("click", function() {
    const buisnesection = document.getElementById('businessCard');

    // Toggle form visibility
    if (buisnesection.classList.contains('hidden')) {
        buisnesection.classList.remove('hidden');
        buisnesection.classList.add('visible');
    } else {
        buisnesection .classList.remove('visible');
        buisnesection.classList.add('hidden');
    }
});

