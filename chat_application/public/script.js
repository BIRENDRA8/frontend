// public/script.js
const chatbox = document.getElementById('chatbox');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const loadingIndicator = document.getElementById('loading');
const errorMessageDiv = document.getElementById('error-message');

// Function to add a message to the chatbox
function addMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender); // 'user' or 'ai'
    messageDiv.textContent = message;
    chatbox.appendChild(messageDiv);
    // Scroll to the bottom
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to show/hide loading indicator
function setLoading(isLoading) {
    loadingIndicator.classList.toggle('hidden', !isLoading);
}

// Function to display errors
function displayError(message) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.classList.remove('hidden');
     // Hide error after a few seconds
    setTimeout(() => {
        errorMessageDiv.classList.add('hidden');
    }, 5000);
}

// Function to send message to backend
async function sendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return; // Don't send empty messages

    // Display user message immediately
    addMessage(messageText, 'user');
    userInput.value = ''; // Clear input field
    setLoading(true); // Show loading indicator
    errorMessageDiv.classList.add('hidden'); // Hide previous errors

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: messageText }),
        });

        setLoading(false); // Hide loading indicator

        if (!response.ok) {
            // Try to get error message from backend response body
            const errorData = await response.json().catch(() => ({ error: 'Unknown server error' })); // Handle cases where JSON parsing fails
            console.error('Error from server:', response.status, errorData);
            displayError(`Error: ${errorData.error || `Server responded with status ${response.status}`}`);
            return; // Stop processing if there was an error
        }

        const data = await response.json();
        addMessage(data.reply, 'ai'); // Display AI response

    } catch (error) {
        setLoading(false); // Hide loading indicator
        console.error('Network or fetch error:', error);
        displayError('Network error. Could not reach the server.');
    }
}

// Event listeners
sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (event) => {
    // Send message if Enter key is pressed
    if (event.key === 'Enter') {
        sendMessage();
    }
});