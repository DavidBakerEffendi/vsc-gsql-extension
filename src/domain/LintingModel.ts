export class LintingDetails {
    errorType: string;
    endColumn: number;
    endLine: number;
    message: string;
    startColumn: number;
    startLine: number;

    constructor(
        errorType: string,
        startLine: number,
        startColumn: number,
        endLine: number,
        endColumn: number,
        message: string,
    ) {
        this.errorType = errorType;
        this.endColumn = endColumn;
        this.endLine = endLine;
        this.message = message;
        this.startColumn = startColumn;
        this.startLine = startLine;
    }
}

// TODO: Should find a list of all errors
export enum LintExceptionType {
    TYPE_ERROR,
    WARNING
}