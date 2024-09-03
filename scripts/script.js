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

function searchWhatsAppContacts(query) {
  // Select the search input field
  const searchInput = document.querySelector('div[contenteditable="true"][data-tab="3"]');
  
  if (!searchInput) {
    console.error('Search input not found. Make sure you are on WhatsApp Web.');
    return;
  }

  // Clear existing search
  searchInput.textContent = '';

  // Focus on the search input
  searchInput.focus();
  searchInput.click();

  // Dispatch focus and click events
  const focusEvent = new FocusEvent('focus', { bubbles: true });
  const clickEvent = new MouseEvent('click', { bubbles: true });
  searchInput.dispatchEvent(focusEvent);
  searchInput.dispatchEvent(clickEvent);
  document.execCommand('insertText', false, query);

  // Trigger the search
  const enterEvent = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    keyCode: 13,
    which: 13
  });
  searchInput.dispatchEvent(enterEvent);

  console.log(`Searching for: ${query}`);
}

initiateNewWhatsAppChat()
// Example usage:
searchWhatsAppContacts('Moniflow');