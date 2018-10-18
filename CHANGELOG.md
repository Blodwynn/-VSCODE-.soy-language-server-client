# Change Log
All notable changes to this extension will be documented in this file.

# 1.0.0
- Initial release

## 1.1.0
- Adding check for `$` in variable declarations

### 1.1.1
- Adding this CHANGELOG and a basic README file :)

## 1.2.0
- Adding snippets :)

### 1.2.1
- fixing the name and description of the extension

# 2.0.0
- adding syntax highlight
- adding autoclosing for brackets

## 2.1.0
- adding `kind` highlight

### 2.1.1
- fixing value highlights

### 2.1.2
- fixing comment area

### 2.1.4
- fixing comment area again

## 2.2.0
- adding `setClientData` and `i18nJS` to highlights

### 2.2.1
- fixing `forEach` closing highlight

### 2.2.2
- fixing `template` and `deltemplate` definition highlights

### 2.2.3
- fixing highlight for `param` comments

## 2.3.0
- adding `noAutoescape` highlight

## 2.4.0
- adding `autoescape="strict"` snippet

# 3.0.0
- adding **Go to Definiton** support

### 3.0.4
- fixes

## 3.1.0
- bracket closing pair autoinsertion

### 3.1.1
- fixing `delpackage` highlight

## 3.2.0
- adding `delcall` Go To Definition support

### 3.2.1
- adding `variant` highlight
- fixing `noAutoescape` highlights when adding it to a variable

### 3.2.2
- A **HUGE** thanks to [Nick Fisher](https://github.com/spadgos) for the following changes:
    - fixing `floor` and `ceiling` highlight
    - fixing `for-in` highlight
    - fixing a wide range of word boundary matches
- fixing the `@param` highlight when it's in the template

### 3.2.3
- expanded highlight for `range`, `elseif`, `default`, `nil`, `lb`, `rb`, `ifempty`, `msg`, `fallbackmsg`

### 3.2.4
- fixing single quotes causing issues - Thanks to [Nick Fisher](https://github.com/spadgos) for the report [ISSUE-2](https://github.com/Blodwynn/-VSCODE-.soy-language-server-client/issues/2)
- fixing the extension reporting false errors - Thanks to [Nick Fisher](https://github.com/spadgos) for the report [ISSUE-3](https://github.com/Blodwynn/-VSCODE-.soy-language-server-client/issues/3)

### 3.2.5
- fixing the extension reporting another kind of false error - Thanks to [Nick Fisher](https://github.com/spadgos) for the report [ISSUE-4](https://github.com/Blodwynn/-VSCODE-.soy-language-server-client/issues/4)
- giving highlight to non-doc multi-line comments

### 3.2.6
- fixing doc comment highlight for @items

## 3.3.0
Thanks to [Nick Fisher](https://github.com/spadgos) for the following [changes](https://github.com/Blodwynn/-VSCODE-.soy-language-server-client/pull/5):
- highlighting `alias` - `as`
- extending highlight of `param` types
- adding support to a large number of build-in functions
- some under the hood changes
