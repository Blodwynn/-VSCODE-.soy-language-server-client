import { ErrorItem } from './interfaces';

// The patterns' only group will be the part underlined
const error: ErrorItem[] = [
    // LET
    { pattern: /(\{\s*let\s+\$[\w\d."'=]+\s*\/?\})/ig,          message: 'Empty declaration. Missing :value or kind=.'},
    { pattern: /(\{\s*let\s+\w+[^\n]*?\})/ig,                   message: 'Missing $ sign for variable declaration'},
    { pattern: /(\{\s*let[^\n]*?kind=[^}]*?\/\})/ig,            message: 'Unnecessary closing tag for LET opening tag'},
    { pattern: /(\{\s*let\s+\$[\w\d."'=]+\s*:[^\n]*[^/]\})/ig,  message: 'Missing closing tag for LET declaration'},
    { pattern: /(\{\s*let[^\n]*?\/\s+})/ig,                     message: 'Extra spacing before closing tag'},
    { pattern: /(\{\s*let\s+\$[\w\d."'=]+\s+[^:\n]+\/\})/ig,    message: 'Missing colon from LET declaration'},

    // PARAM
    { pattern: /(\{\s*param\s+[\w\d."'=]+\s*\/?\})/ig,           message: 'Empty declaration. Missing :value or kind=.'},
    { pattern: /(\{\s*param[^\n]*?kind=[^}]*?\/\})/ig,           message: 'Unnecessary closing tag for PARAM opening tag'},
    { pattern: /(\{\s*param\s+[\w\d."'=]+?\s*:[^}\n]*[^/]\})/ig, message: 'Missing closing tag for parameter'},
    { pattern: /(\{\s*param[^\n]*?\/\s+})/ig,                    message: 'Extra spacing before closing tag'},
    { pattern: /(\{\s*param\s+[\w\d."'=]+\s+[^:\n]+\/\})/ig,     message: 'Missing colon from PARAM declaration'},
    { pattern: /(\{\s*param\s+\$[\w\d."'=]+)/ig,                 message: 'Unnecessary $ sign for param name'},

    { pattern: /(\{template[^\n]*?\/\s*\})/ig,                   message: 'Self closing is not applicable for templates' },
    { pattern: /(\{deltemplate[^\n]*?\/\s*\})/ig,                message: 'Self closing is not applicable for deltemplates' }
];

const breakingChange: ErrorItem[] = [
    { pattern: /\/\/[^\n]*(breaking ?change)/ig, message: 'To be checked for followups' }
];

const todo: ErrorItem[] = [
    { pattern: /\/\/[^\n]*(TO ?DO)/ig, message: 'To be checked for followups' }
];

export default {
    error,
    breakingChange,
    todo
};
