export interface ErrorItem {
    pattern: RegExp;
    message: string;
}

export interface SoyConfigSettings {
    ignoreTodo: boolean;
    ignoreBreakingChange: boolean;
    ignoreErrors: boolean;
}
