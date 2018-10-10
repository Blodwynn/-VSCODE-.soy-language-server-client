# Google closure template syntax checker (.soy)
Checks `.soy` files for errors and warnings inline in the editor

## Functionality
- Syntax check: inline error and warning underline
- Syntax highlight
- Snippets

### Error highlights
- Missing `$` sign in variable declarations
- Missing closing tag for `let` declarations and `param`s
- Extra space before closing tag for `let`s and `param`s
- Unnecessary `/` character for `let` and `param` blocks
- Self closing for `template`s and `deltemplate`s

### Warning highlights
- `TODO` comments
- `Breaking Change` comments

### Syntax highlight

### Snippets
All snippets start with the character `s` to be able to quickly search for them.

**Snippets**:
- **sfor** - `foreach` block
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

