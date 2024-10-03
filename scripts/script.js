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

//
/*
function scrollMessagesUp(pixels = 100) {
    // Find the element with class "_ajyl" and tabindex="0"
    const element = document.querySelector('div._ajyl[tabindex="0"]');
    
    if (!element) {
        console.error('Element with class "_ajyl" and tabindex="0" not found');
        return;
    }

    // Check if the element is scrollable
    const isScrollable = element.scrollHeight > element.clientHeight;

    if (!isScrollable) {
        console.log('The element is not scrollable');
        return;
    }

    // Calculate the new scroll position
    const newScrollTop = Math.max(0, element.scrollTop - pixels);

    // Scroll up
    element.scrollTo({
        top: newScrollTop,
        behavior: 'smooth'
    });

    console.log(`Scrolled up by ${Math.min(pixels, element.scrollTop)} pixels`);
}

// Run the scrollUp function
// You can change the number of pixels to scroll here
scrollMessagesUp(100);
*/

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
          const timeMatch = prePlainText.match(/\[(.*?)\]/); // Extract the timestamp part
          const time = timeMatch ? timeMatch[1] : ''; // Get the time from the match
          const cleanedMessage = prePlainText.replace(/\[(.*?)\]\s*/, ''); // Remove the timestamp from the message

          const fullMessage = cleanedMessage + messageText.innerText;
          let messageType = '';
          if (container.closest('.message-out')) {
              messageType = 'message-out'; // Outgoing message
          } else if (container.closest('.message-in')) {
              messageType = 'message-in';  // Incoming message
          }

          messages.push({ text: fullMessage, type: messageType, time: time });
      }
  });
  console.log('Extracted messages:', messages);
  return messages;
}