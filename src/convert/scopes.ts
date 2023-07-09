import fs from "fs";

import REGEX from "./regex";
import path from "path";
import { isTag } from "./tagDetection";

export type Scope = {
    type: "css" | "js",
    remote: boolean,
    path: string
}
export function checkForExistingScopes(css: Set<string>, js: Set<string>): Scope[] {
    let scopes: Scope[] = [];
    css.forEach(pathStr => {
        if (fs.existsSync(pathStr)) {
            scopes.push({
                type: "css",
                remote: false,
                path: pathStr
            });
        }
    });
    js.forEach(pathStr => {
        if (fs.existsSync(pathStr)) {
            scopes.push({
                type: "js",
                remote: false,
                path: pathStr
            });
        }
    });
    return scopes;
}

function isValidScopeType(type: string) {
    return type == "\"css\"" || type == "\"js\"";
}
// Error messages
function noScopeTypeError() {
    return new Error(`No scope type defined in the <SCOPES /> component. Please add a type property with either "css" or "js"`);
}
function unknownScopeTypeError(unknownType: string) {
    return new Error(`Unknown type ${unknownType} in <SCOPES /> component. Please use either "css" or "js"`);
}
function generateScopeCode(data: { size: number; attr: { [key: string]: string; }; tagname: string; }, scopes: Scope[], isDev: boolean): string {
    if (!("type" in data.attr)) throw noScopeTypeError();
    if (!isValidScopeType(data.attr.type)) throw unknownScopeTypeError(data.attr.type);
    const scopeType = data.attr.type.slice(1, -1);
    let scopesUsed = scopes.filter(scope => scope.type == scopeType);
    let remoteScopes: string[] = [];
    let contents: { content: string, path: string }[] = [];
    scopesUsed.forEach(scopeUsed => {
        if (!scopeUsed.remote) {
            contents.push({
                content: fs.readFileSync(scopeUsed.path, 'utf8'),
                path: scopeUsed.path
            });
        } else {
            remoteScopes.push(scopeUsed.path);
        }
    })
    const joinedContents = contents.map(content => {
        if (!isDev) return content.content;
        return `\n/* DEBUG: Start scoped ${scopeType} for file: ${path.relative(process.cwd(), content.path)} */\n` + content.content;
    }).join(isDev ? "\n" : "");
    return scopeType == "css" ? `${remoteScopes.map(remoteScope => {
        if (
            (remoteScope.startsWith("\"") || remoteScope.startsWith("'")) ||
            (remoteScope.endsWith("\"") || remoteScope.endsWith("'"))
        ) {
            remoteScope = remoteScope.slice(1, -1);
        }
        return `<link rel="stylesheet" href="${remoteScope}">`;
    }).join("")}<style>${joinedContents + (isDev ? "\n" : "")}\n</style>` : `${remoteScopes.map(remoteScope => {
        if (
            (remoteScope.startsWith("\"") || remoteScope.startsWith("'")) ||
            (remoteScope.endsWith("\"") || remoteScope.endsWith("'"))
        ) {
            remoteScope = remoteScope.slice(1, -1);
        }
        return `<script src="${remoteScope}"></script>`;
    }).join("")}<script>${joinedContents + (isDev ? "\n" : "")}</script>`;
}

export function handleScopes(code: string, scopes: Scope[], isDev: boolean): string {
    let output = "";
    let isInPhp = false;
    let isInString: false | "\"" | "'" = false;
    let skipNext = false;
    for (let charIndex = 0; charIndex < code.length; charIndex++) {
        let match;
        if ((match = code.slice(charIndex).match(REGEX.php.open)) != null && isInString == false) {
            isInPhp = true;
            output += match[0];
            charIndex += match[0].length - 1;
            continue;
        }
        if ((match = code.slice(charIndex).match(REGEX.php.close)) != null && isInString == false) {
            isInPhp = false;
            output += match[0];
            charIndex += match[0].length - 1;
            continue;
        }
        if (isInPhp && isInString == false && code[charIndex] == "\"" && !skipNext) {
            isInString = "\"";
            output += "\"";
            continue;
        }
        if (isInPhp && isInString == "\"" && code[charIndex] == "\"" && !skipNext) {
            isInString = false;
            output += "\"";
            continue;
        }
        if (isInPhp && isInString == false && code[charIndex] == "'" && !skipNext) {
            isInString = "'";
            output += "'";
            continue;
        }
        if (isInPhp && isInString == "'" && code[charIndex] == "'" && !skipNext) {
            isInString = false;
            output += "'";
            continue;
        }
        if (code[charIndex] == "\\" && isInPhp && isInString != false) {
            skipNext = true;
            output += "\\";
            continue;
        } else {
            skipNext = false;
        }
        if ((match = isTag("/>", code, charIndex)) != false && match.tagname == "SCOPES" && !isInPhp) {
            output += generateScopeCode(match, scopes, isDev);
            charIndex += match.size - 1;
            continue;
        }
        output += code[charIndex];
    }
    return output;
}