import * as vscode from 'vscode';
import { ApiClient } from './apiClient';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'deepAssistant.chatView';

  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _apiClient: ApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'sendMessage': {
          const userMessage = data.message;
          // Send typing indicator
          webviewView.webview.postMessage({
            type: 'typingStart',
          });

          try {
            const response = await this._apiClient.sendMessage(userMessage);
            webviewView.webview.postMessage({
              type: 'receiveMessage',
              message: response,
            });
          } catch (error) {
            webviewView.webview.postMessage({
              type: 'receiveMessage',
              message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          } finally {
            webviewView.webview.postMessage({
              type: 'typingStop',
            });
          }
          break;
        }
      }
    });
  }

  public focusView() {
    if (this._view) {
      this._view.show?.(true);
    }
  }

  public clearChat() {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'clearChat',
      });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Deep Assistant Chat</title>
    <style>
        body {
            padding: 0;
            margin: 0;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }

        #chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }

        #messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .message {
            padding: 8px 12px;
            border-radius: 6px;
            max-width: 85%;
            word-wrap: break-word;
        }

        .user-message {
            align-self: flex-end;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }

        .assistant-message {
            align-self: flex-start;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
        }

        .typing-indicator {
            padding: 8px 12px;
            border-radius: 6px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            align-self: flex-start;
            max-width: 85%;
        }

        .typing-indicator::after {
            content: '...';
            animation: typing 1.5s infinite;
        }

        @keyframes typing {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
        }

        #input-container {
            display: flex;
            gap: 8px;
            padding: 10px;
            border-top: 1px solid var(--vscode-panel-border);
        }

        #message-input {
            flex: 1;
            padding: 8px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        #message-input:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }

        #send-button {
            padding: 8px 16px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }

        #send-button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        #send-button:active {
            background-color: var(--vscode-button-background);
        }

        #send-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        pre {
            background-color: var(--vscode-textCodeBlock-background);
            padding: 8px;
            border-radius: 4px;
            overflow-x: auto;
        }

        code {
            font-family: var(--vscode-editor-font-family);
        }
    </style>
</head>
<body>
    <div id="chat-container">
        <div id="messages"></div>
        <div id="input-container">
            <input type="text" id="message-input" placeholder="Type your message..." />
            <button id="send-button">Send</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        let typingIndicator = null;

        function addMessage(content, isUser) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user-message' : 'assistant-message');

            // Simple markdown-like formatting
            let formattedContent = content
                .replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>')
                .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
                .replace(/\\n/g, '<br>');

            messageDiv.innerHTML = formattedContent;
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showTypingIndicator() {
            if (!typingIndicator) {
                typingIndicator = document.createElement('div');
                typingIndicator.className = 'typing-indicator';
                typingIndicator.textContent = 'AI is thinking';
                messagesContainer.appendChild(typingIndicator);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        function hideTypingIndicator() {
            if (typingIndicator) {
                typingIndicator.remove();
                typingIndicator = null;
            }
        }

        function sendMessage() {
            const message = messageInput.value.trim();
            if (message) {
                addMessage(message, true);
                vscode.postMessage({
                    type: 'sendMessage',
                    message: message
                });
                messageInput.value = '';
                sendButton.disabled = true;
            }
        }

        sendButton.addEventListener('click', sendMessage);

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Handle messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'receiveMessage':
                    hideTypingIndicator();
                    addMessage(message.message, false);
                    sendButton.disabled = false;
                    break;
                case 'typingStart':
                    showTypingIndicator();
                    break;
                case 'typingStop':
                    hideTypingIndicator();
                    sendButton.disabled = false;
                    break;
                case 'clearChat':
                    messagesContainer.innerHTML = '';
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}
