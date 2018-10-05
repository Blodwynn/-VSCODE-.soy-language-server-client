# Google closure template syntax checker (.soy)
Checks `.soy` files for errors and warnings inline in the editor

## Functionality
Provides inline error and warning highlight in the VS Code editor window

### Error highlights
- Missing $ sign in variable declarations
- Missing closing tag for `let` declarations and `param`s
- Extra space before closing tag for `let`s and `param`s
- Unnecessary `/` character for `let` and `param` blocks
- Self closing for `template`s and `deltemplate`s

### Warning highlights
- `TODO` comments
- `Breaking Change` comments
