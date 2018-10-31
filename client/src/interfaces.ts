export interface SoyDefinitionInformation {
	file: string;
	line: number;
}

export interface TemplatePathDescription {
    path: string;
    line: number;
}

export interface TemplatePathMap {
    [template: string]: TemplatePathDescription[]
}

export interface CallMap {
    [template: string]: SoyDefinitionInformation[]
}

export interface AliasMap {
    alias: string;
    aliasName: string;
}
