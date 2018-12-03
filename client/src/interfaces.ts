export interface TemplatePathDescription {
    path: string;
    line: number;
}

export interface TemplatePathMap {
    [template: string]: TemplatePathDescription[];
}

export interface AliasMap {
    alias: string;
    aliasName: string;
}
