import * as vscode from 'vscode';
import { Hover } from 'vscode';

export class LintingProvider implements vscode.CodeActionProvider {
    public static readonly fixAllCodeActionKind = vscode.CodeActionKind.SourceFixAll.append('gsqllint');

    public static metadata: vscode.CodeActionProviderMetadata = {
        providedCodeActionKinds: [LintingProvider.fixAllCodeActionKind],
    };

    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection, context: vscode.CodeActionContext, token: vscode.CancellationToken):
        vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        console.debug(document);
        return [{
            ...[],
            title: 'Fix All GSQLLint',
            kind: LintingProvider.fixAllCodeActionKind,
        }];
    }

}