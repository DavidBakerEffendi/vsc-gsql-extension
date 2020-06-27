import * as vscode from 'vscode';
import { LintingDetails } from './domain/LintingModel';

const axios = require('axios').default;

export function activate(context: vscode.ExtensionContext) {
    // TODO: Begin linting

    var codeSnippet: string = "CREATE QUERY rr() FOR GRAPH MyGraph API(\"v2\") SYNTAX v2 {\n\n\n  VertexSet_2 = \n        SELECT alias_schema_2\n        FROM vertex_type_1:alias_schema_1 -(edge_type_1:alias_schema_3)- vertex_type_1:alias_schema_2\n        ;\n  \n\n\n  PRINT VertexSet_2[\"\" as no_attributes];\n\n}\n";
    var normalizedErrorsOrWarnings: Array<LintingDetails> = [];
    console.debug("Henlo");
    try {
        axios.post('https://vsc-gsql-extension.i.tgcloud.io:14240/gsqlserver/gsql/codecheck', {
            "code": codeSnippet,
            "graph": "MyGraph"
        }, {
            'Authorization': 'Bearer 5f4pmgpt4f4gls25ejikecq9e9ec40b1'
        }).then(function (response: any) {
            if ('warnings' in response.data && 'errors' in response.data) {
                response.data.warnings.forEach((d: any) => {
                    normalizedErrorsOrWarnings.push(normalizeErrorOrWarning(codeSnippet, d));
                });
                response.data.errors.forEach((d: any) => {
                    normalizedErrorsOrWarnings.push(normalizeErrorOrWarning(codeSnippet, d));
                });
            }

            normalizedErrorsOrWarnings.forEach((l: LintingDetails) => console.debug(l));
        }).catch(function (err: any) {
            console.debug(typeof (err));
            console.debug(err);
        });
    } catch (e) {
        console.debug('axios error' + e);
    }

    let timeout: NodeJS.Timer | undefined = undefined;

    // create a decorator type that we use to decorate small numbers
    const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
        borderWidth: '1px',
        borderStyle: 'solid',
        overviewRulerColor: 'blue',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        light: {
            // this color will be used in light color themes
            borderColor: 'darkblue'
        },
        dark: {
            // this color will be used in dark color themes
            borderColor: 'lightblue'
        }
    });

    // create a decorator type that we use to decorate large numbers
    const largeNumberDecorationType = vscode.window.createTextEditorDecorationType({
        cursor: 'underline',
        // use a themable color. See package.json for the declaration and default values.
        backgroundColor: { id: 'myextension.largeNumberBackground' }
    });

    function updateDecorations() {
        if (!activeEditor) {
            return;
        }
        const regEx = /\d+/g;
        const text = activeEditor.document.getText();
        const smallNumbers: vscode.DecorationOptions[] = [];
        const largeNumbers: vscode.DecorationOptions[] = [];
        let match;
        while ((match = regEx.exec(text))) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.positionAt(match.index + match[0].length);
            const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'Number **' + match[0] + '**' };
            if (match[0].length < 3) {
                smallNumbers.push(decoration);
            } else {
                largeNumbers.push(decoration);
            }
        }
        activeEditor.setDecorations(smallNumberDecorationType, smallNumbers);
        activeEditor.setDecorations(largeNumberDecorationType, largeNumbers);
    }

    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
        timeout = setTimeout(updateDecorations, 500);
    }

    let activeEditor = vscode.window.activeTextEditor;

    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);
}

/**
 * Normalize the error or warning from different response format:
 * 1. Only contains a message: mark the whole query
 * 2. Only contains start position: mark until token ends
 * 3. Contains both start and end positions: mark the range
 *
 * 
 * @param {string} code
 * @param {*} error
 * @returns {{
 *     startLine: number;
 *     startColumn: number;
 *     endLine: number;
 *     endColumn: number;
 *     message: string;
 *   }}
 */
function normalizeErrorOrWarning(
    code: string,
    error: any
): LintingDetails {
    const lines = code.split('\n');
    const errorType = error.errortype;
    const message = error.msg;
    let markStart: number = -1;
    let markStop: number = -1;
    // Has startLine, startColumn, endLine, endColumn
    if (
        'startLine' in error
        && 'startColumn' in error
        && 'endLine' in error
        && 'endColumn' in error
    ) {
        return new LintingDetails(
            errorType,
            error.startLine - 1,
            error.startColumn,
            error.endLine - 1,
            error.endColumn,
            message
        );
    }
    // Has start and stop index
    if ('startindex' in error && 'stopindex' in error) {
        markStart = error.startindex;
        markStop = error.stopindex + 1;
    }
    if (markStart !== -1) {
        // If it's parsing error, mark until token ends
        if ('line' in error) {
            const line = error.line - 1; // parsing error line number is always actual line number + 1
            const pos = error.charpositioninline;
            let endPos = pos;
            for (; endPos < lines[line].length; endPos++) {
                if ([' ', '\t', '\n'].includes(lines[line].charAt(endPos))) {
                    break;
                }
            }
            return new LintingDetails(
                errorType,
                line,
                pos,
                line,
                endPos,
                message
            );
        } else {
            // Nothing there, mark the whole code
            return new LintingDetails(
                errorType,
                0,
                0,
                lines.length - 1,
                lines[lines.length - 1].length,
                message
            );
        }
    } else {
        // Contains both start position and end position
        const prefixStart = code.substring(0, markStart);
        const prefixStop = code.substring(0, markStop);
        return new LintingDetails(
            errorType,
            prefixStart.split('\n').length - 1,
            markStart - prefixStart.lastIndexOf('\n') - 1,
            prefixStop.split('\n').length - 1,
            markStop - prefixStop.lastIndexOf('\n') - 1,
            message
        );
    }
}