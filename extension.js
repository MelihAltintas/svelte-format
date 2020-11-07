const vscode = require('vscode');
const formatInit = require('./src');

function activate(context) {

    let disposable = vscode.commands.registerCommand('svelte-format.format', function () {
        let acEditor = vscode.window.activeTextEditor;
    
        if (acEditor && acEditor.document.languageId === 'svelte') {
            formatInit.init();
        } else {
            vscode.window.showInformationMessage('It‘s not a .svelte file');
        }
        
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

function deactivate() {
    vscode.window.showInformationMessage('deactivated');
}

exports.deactivate = deactivate;