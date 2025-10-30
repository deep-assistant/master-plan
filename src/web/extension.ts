import * as vscode from 'vscode';
import { ChatViewProvider } from '../chatViewProvider';
import { ApiClient } from '../apiClient';

let chatViewProvider: ChatViewProvider;
let apiClient: ApiClient;

export function activate(context: vscode.ExtensionContext) {
  console.log('Deep Assistant web extension is now active (running in browser)');

  // Initialize API client
  apiClient = new ApiClient();

  // Register chat view provider
  chatViewProvider = new ChatViewProvider(context.extensionUri, apiClient);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, chatViewProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('deepAssistant.chat', () => {
      chatViewProvider.focusView();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('deepAssistant.clearChat', async () => {
      const confirmed = await vscode.window.showWarningMessage(
        'Are you sure you want to clear chat history?',
        'Yes',
        'No'
      );
      if (confirmed === 'Yes') {
        await apiClient.clearDialog();
        chatViewProvider.clearChat();
        vscode.window.showInformationMessage('Chat history cleared');
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('deepAssistant.selectModel', async () => {
      const models = [
        'gpt-4o',
        'gpt-4o-mini',
        'claude-3-7-sonnet',
        'claude-3-5-sonnet',
        'claude-sonnet-4',
        'deepseek-chat',
        'deepseek-reasoner',
        'o1-preview',
        'o1-mini',
        'o3-mini',
      ];

      const selected = await vscode.window.showQuickPick(models, {
        placeHolder: 'Select an AI model',
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration('deepAssistant');
        await config.update('defaultModel', selected, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Model changed to ${selected}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('deepAssistant.showSettings', () => {
      vscode.commands.executeCommand('workbench.action.openSettings', 'deepAssistant');
    })
  );

  // Show welcome message for web version
  vscode.window.showInformationMessage(
    'Deep Assistant is ready to use on github.dev! Configure your API token in settings.'
  );
}

export function deactivate() {
  console.log('Deep Assistant web extension is now deactivated');
}
