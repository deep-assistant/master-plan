// DOM Elements
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');
const newChatBtn = document.getElementById('new-chat-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const apiUrlInput = document.getElementById('api-url');
const apiKeyInput = document.getElementById('api-key');
const settingsStatus = document.getElementById('settings-status');

// State
let currentChatId = 1;
let apiConfig = {
    apiUrl: '',
    apiKey: ''
};

// Initialize
async function init() {
    // Load API configuration
    apiConfig = await window.electronAPI.getApiConfig();
    apiUrlInput.value = apiConfig.apiUrl || '';
    apiKeyInput.value = apiConfig.apiKey || '';

    // Setup event listeners
    setupEventListeners();

    // Listen for menu events
    window.electronAPI.onNewChat(() => handleNewChat());
    window.electronAPI.onOpenSettings(() => showSettings());

    // Auto-resize textarea
    messageInput.addEventListener('input', autoResizeTextarea);
}

function setupEventListeners() {
    sendBtn.addEventListener('click', handleSendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    messageInput.addEventListener('input', () => {
        sendBtn.disabled = messageInput.value.trim() === '';
    });

    newChatBtn.addEventListener('click', handleNewChat);
    settingsBtn.addEventListener('click', showSettings);
    closeSettingsBtn.addEventListener('click', hideSettings);
    saveSettingsBtn.addEventListener('click', handleSaveSettings);
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
}

async function handleSendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Check if API is configured
    if (!apiConfig.apiUrl || !apiConfig.apiKey) {
        showSettingsError('Please configure API settings first');
        showSettings();
        return;
    }

    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Remove welcome message if present
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    // Add user message to chat
    addMessage(message, 'user');

    // Add assistant loading message
    const loadingId = 'loading-' + Date.now();
    addMessage('Thinking...', 'assistant', loadingId);

    try {
        // Send message to API via IPC
        const response = await window.electronAPI.sendMessage({
            message: message,
            apiUrl: apiConfig.apiUrl,
            apiKey: apiConfig.apiKey
        });

        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }

        // Add assistant response
        if (response.success) {
            addMessage(response.message, 'assistant');
        } else {
            addMessage('Error: ' + (response.error || 'Failed to get response'), 'assistant');
        }
    } catch (error) {
        // Remove loading message
        const loadingElement = document.getElementById(loadingId);
        if (loadingElement) {
            loadingElement.remove();
        }

        addMessage('Error: ' + error.message, 'assistant');
    }
}

function addMessage(content, role, id) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    if (id) {
        messageDiv.id = id;
    }

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : 'A';

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function handleNewChat() {
    // Clear messages
    messagesContainer.innerHTML = `
        <div class="welcome-message">
            <h2>Welcome to Deep Assistant</h2>
            <p>Start a conversation by typing a message below.</p>
            <div class="info-notice">
                <strong>Note:</strong> Please configure your API settings before starting.
            </div>
        </div>
    `;

    currentChatId++;

    // In a full implementation, this would create a new chat history item
}

function showSettings() {
    settingsPanel.classList.remove('hidden');
    settingsPanel.classList.add('visible');
}

function hideSettings() {
    settingsPanel.classList.remove('visible');
    setTimeout(() => {
        settingsPanel.classList.add('hidden');
    }, 300);
}

async function handleSaveSettings() {
    const apiUrl = apiUrlInput.value.trim();
    const apiKey = apiKeyInput.value.trim();

    if (!apiUrl || !apiKey) {
        showSettingsError('Please fill in all fields');
        return;
    }

    // Validate URL format
    try {
        new URL(apiUrl);
    } catch (e) {
        showSettingsError('Invalid API URL format');
        return;
    }

    // Save configuration
    apiConfig = { apiUrl, apiKey };
    const result = await window.electronAPI.saveApiConfig(apiConfig);

    if (result.success) {
        showSettingsSuccess('Settings saved successfully');
        setTimeout(() => {
            hideSettings();
        }, 1500);
    } else {
        showSettingsError('Failed to save settings');
    }
}

function showSettingsSuccess(message) {
    settingsStatus.textContent = message;
    settingsStatus.className = 'status-message success';
    setTimeout(() => {
        settingsStatus.className = 'status-message hidden';
    }, 3000);
}

function showSettingsError(message) {
    settingsStatus.textContent = message;
    settingsStatus.className = 'status-message error';
    setTimeout(() => {
        settingsStatus.className = 'status-message hidden';
    }, 3000);
}

// Initialize when DOM is ready
init();
