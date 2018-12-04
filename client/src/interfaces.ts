export interface ITemplatePathDescription {
    path: string;
    line: number;
}

export interface ITemplatePathMap {
    [template: string]: ITemplatePathDescription[];
}

export interface IAliasMap {
    alias: string;
    aliasName: string;
}
