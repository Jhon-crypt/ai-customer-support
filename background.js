function openChat(contactName) {
    function simulateMouseClick(element) {
        const mouseEvent = new MouseEvent('mousedown', {
            view: window,
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(mouseEvent);
    }

    function extractMessages() {
        const messageContainers = document.querySelectorAll(".message-in, .message-out");
        const messages = [];

        messageContainers.forEach(container => {
            const messageTextElement = container.querySelector(".copyable-text");
            if (messageTextElement) {
                const messageText = messageTextElement.textContent || messageTextElement.innerText;
                messages.push(messageText);
            }
        });

        return messages;
    }

    const contactList = document.querySelectorAll("div[role='listitem']");
    for (const contact of contactList) {
        const nameElement = contact.querySelector("span[dir='auto']");
        if (nameElement && nameElement.textContent === contactName) {
            simulateMouseClick(contact);
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(extractMessages());
                }, 2000);
            });
        }
    }

    return Promise.resolve(["Contact not found"]);
}
