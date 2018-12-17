export enum GlobalState {
    CurrentVersion = 'soyFileSupportVersion'
}

export enum Commands {
    // Soy Extension commands
    ReparseWorkSpace     = 'soyfilesupport.reparse.workspace',
    ShowExtensionChanges = 'soyfilesupport.showExtensionChanges',
    About                = 'soyfilesupport.about',

    // VS Code commands
    ShowMarkDownPreview  = 'markdown.showPreview'
}

export enum ExtensionData {
    ExtensionIdentifier = 'Blodwynn.soysyntaxchecker'
}

export enum TriggerCharacters {
    Dot = '.',
    LeftBrace = '{'
}

export enum UpdateNotificationItem {
    SeeUpdates = 'Let\'s see!',
    Dismiss    = 'Maybe later...'
}
