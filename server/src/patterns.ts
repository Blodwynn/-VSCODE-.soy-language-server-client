import { ErrorItem } from './interfaces';

const errorPatterns: ErrorItem[] = [
    // LET
    { pattern: /\{\s*let\s+\w.*?\}/ig,                  message: 'Missing $ sign for variable declaration'},
    { pattern: /\{\s*let.*?kind=[^}]*?\/\}/ig,          message: 'Unnecessary closing tag for LET opening tag'},
    { pattern: /\{\s*let \$[\w\d."'=]+:(.*)[^/]\}/ig,   message: 'Missing closing tag for LET declaration'},
    { pattern: /\{\s*let.*?\/ }/ig,                     message: 'Extra spacing before closing tag'},

    // PARAM
    { pattern: /\{\s*param.*?kind=[^}]*?\/\}/ig,        message: 'Unnecessary closing tag for PARAM opening tag'},
    { pattern: /\{\s*param [\w\d."'=]+?:[^}]*[^/]\}/ig, message: 'Missing closing tag for parameter'},
    { pattern: /\{\s*param.*?\/ }/ig,                   message: 'Extra spacing before closing tag'},

    { pattern: /\{template.*?\/\s*\}/ig,                message: 'Self closing is not applicable for templates' },
    { pattern: /\{deltemplate.*?\/\s*\}/ig,             message: 'Self closing is not applicable for deltemplates' }
];

const breakingChangePatterns: ErrorItem[] = [
    { pattern: /breaking ?change/ig, message: 'To be checked for followups' }
];

const todoPatterns: ErrorItem[] = [
    { pattern: /TO ?DO/ig,             message: 'To be checked for followups' }
];

export default {
    errorPatterns,
    breakingChangePatterns,
    todoPatterns
}
