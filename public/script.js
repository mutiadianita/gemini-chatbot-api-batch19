const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const themeToggle = document.getElementById('theme-toggle');

// Maintain the conversation history
let conversation = [];

// Dark Mode Toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
});

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const text = userInput.value.trim();
    if (!text) return;

    // 1. Add the user's message to the chat box
    appendMessage(text, 'user', false);
    userInput.value = '';

    // Add to conversation history
    conversation.push({ role: 'user', text: text });

    // 2. Show a temporary "Thinking..." bot message with loading animation
    const thinkingId = addThinkingMessage();

    try {
        // 3. Send the POST request to /api/chat
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversation })
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        // 4. Remove the "Thinking..." message
        removeMessage(thinkingId);

        // 5. Replace with AI's reply or handle missing result
        if (data && data.result) {
            // Render the model response using Markdown
            appendMessage(data.result, 'model', true);
            conversation.push({ role: 'model', text: data.result });
        } else {
            appendMessage('Sorry, no response received.', 'error', false);
        }

    } catch (error) {
        console.error('Chat API Error:', error);
        removeMessage(thinkingId);
        appendMessage('Failed to get response from server.', 'error', false);
    }
});

/**
 * Appends a message to the chat box
 * @param {string} text - The message text
 * @param {string} role - The role (user, model, error)
 * @param {boolean} isMarkdown - Flag to parse message as Markdown
 */
function appendMessage(text, role, isMarkdown = false) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', role); 
    
    if (isMarkdown && typeof marked !== 'undefined') {
        // Use marked to parse the markdown into readable HTML
        messageDiv.innerHTML = marked.parse(text);
    } else {
        messageDiv.textContent = text;
    }
    
    chatBox.appendChild(messageDiv);
    scrollToBottom();
}

/**
 * Adds a temporary thinking message with a typing animation and returns its ID
 * @returns {string} The unique ID of the thinking message element
 */
function addThinkingMessage() {
    const id = 'thinking-' + Date.now();
    const messageDiv = document.createElement('div');
    messageDiv.id = id;
    messageDiv.classList.add('message', 'model', 'thinking');
    
    // Create the loading dots animation container
    const indicator = document.createElement('div');
    indicator.classList.add('typing-indicator');
    indicator.innerHTML = '<span></span><span></span><span></span>';
    
    messageDiv.appendChild(indicator);
    chatBox.appendChild(messageDiv);
    scrollToBottom();
    
    return id;
}

/**
 * Removes a message element by its ID
 * @param {string} id - The ID of the message to remove
 */
function removeMessage(id) {
    const messageDiv = document.getElementById(id);
    if (messageDiv) {
        messageDiv.remove();
    }
}

/**
 * Scrolls the chat box to the bottom
 */
function scrollToBottom() {
    chatBox.scrollTop = chatBox.scrollHeight;
}
