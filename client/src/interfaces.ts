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
