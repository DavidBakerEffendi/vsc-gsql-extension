import * as vscode from 'vscode';
import { LintingDetails } from './domain/LintingModel';
import { LintingProvider } from './provider/LintingProvider';
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

    const selector: vscode.DocumentFilter[] = [];
    for (const language of ['gsql']) {
        selector.push({ language, scheme: 'file' });
        selector.push({ language, scheme: 'untitled' });
    }

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider(selector, new LintingProvider(), LintingProvider.metadata));
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