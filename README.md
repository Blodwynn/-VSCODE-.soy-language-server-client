# Google closure template full file support (.soy)
Add full file support for `.soy` files. See section below. :)

## Functionality
- Syntax highlight
- Syntax check: inline error and warning underline
- Go to definition support
- Find References
- Code autocompletion
- Snippets
- Outline

### Syntax highlight
- Highlights keywords, variables and so :)

### Go To Definition / Peek definition
- `Go to definion` of given template with F12 / ctrl+click
- `Peek definition` support

### Find All References
- `Find all references` with shortcut or from context menu

### Code Autocompletion
- Autocomplete for template calls

### Commands
- `Soy File Support: Reparse workspace`: Useful after external changes (eg: switching branches) to find all new template data
- `Soy File Support: Show extension changes`: Opens your favourite changelog to show what's new :)
- `Soy File Support: About`: Opens the readme file

### Error highlights
- Missing `$` sign in variable declarations
- Missing closing tag for `let` declarations and `param`s
- Extra space before closing tag for `let`s and `param`s
- Unnecessary `/` character for `let` and `param` blocks
- Self closing for `template`s and `deltemplate`s
- Empty declaration
- Missing colon

### Information highlights
- `TODO` comments
- `Breaking Change` comments

### Autoclosing brackets and strings

### Snippets
All snippets start with the character `s` to be able to quickly search for them.

**Snippets**:
- **sfor** - `foreach` block
- **sforin** - `for .. in` block
- **sif** - `if` block
- **sife** - `if-else` block
- **sl** - `let` statement - single line
- **slb** - `let` statement - block
- **sp** - `param` statement - single line
- **spb** - `param` statement - block
- **sps** - `param` signature
- **sc** - `call` block
- **sdelc** - `delcall` block
- **sdelcempty** - `delcall` block with `allowemptydefault="true"`
- **stemp** - `template` skeleton
- **sdeltemp** - `deltemplate` skeleton

