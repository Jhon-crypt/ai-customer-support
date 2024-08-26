function initiateNewWhatsAppChat() {
    // Create a new keyboard event
    const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'n',
        code: 'KeyN',
        which: 78,
        keyCode: 78,
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        altKey: true, // Adding the Alt key
    });

    // Dispatch the event on the document
    document.dispatchEvent(keyboardEvent);
    console.log('Initiated new WhatsApp chat shortcut (Ctrl + Alt + N)');
}

function searchWhatsAppContacts(searchTerm) {
    // Select the search input field
    const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]');

    if (!searchInput) {
        console.error('Search input not found. Make sure you are on WhatsApp Web.');
        return;
    }

    // Clear existing search
    searchInput.textContent = '';

    // Set the search term
    searchInput.focus();
    document.execCommand('insertText', false, searchTerm);

    // Trigger the search
    const inputEvent = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(inputEvent);

    // Simulate pressing Enter key
    setTimeout(() => {
        const enterEvent = new KeyboardEvent('keydown', {
            bubbles: true,
            cancelable: true,
            keyCode: 13,
            which: 13,
            key: 'Enter'
        });
        searchInput.dispatchEvent(enterEvent);
        console.log(`Searched for contacts with: "${searchTerm}" and pressed Enter`);
    }, 1000);
}

initiateNewWhatsAppChat()
searchWhatsAppContacts('Moniflow')
