export enum GlobalState {
    CurrentVersion = 'soyFileSupportVersion'
}

export enum Commands {
    // Soy Extension commands
    ReparseWorkSpace     = 'soyfilesupport.reparse.workspace',
    ShowExtensionChanges = 'soyfilesupport.showExtensionChanges',

    // VS Code commands
    ShowMarkDownPreview  = 'markdown.showPreview'
}

export enum ExtensionData {
    ExtensionIdentifier = 'Blodwynn.soysyntaxchecker'
}
