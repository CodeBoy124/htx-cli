import fs from "fs";

import REGEX from "./regex";
import parseHtmlAttributes from "./parse";
import path from "path";

export type Scope = {
    type: "css" | "js",
    path: string
}
export function checkForExistingScopes(css: Set<string>, js: Set<string>): Scope[] {
    let scopes: Scope[] = [];
    css.forEach(pathStr => {
        if (fs.existsSync(pathStr)) {
            scopes.push({
                type: "css",
                path: pathStr
            });
        }
    });
    js.forEach(pathStr => {
        if (fs.existsSync(pathStr)) {
            scopes.push({
                type: "js",
                path: pathStr
            });
        }
    });
    return scopes;
}

function generateScopeCode(propStr: string, scopes: Scope[], isDev: boolean): string {
    let props = parseHtmlAttributes(propStr);
    if (!("type" in props)) throw new Error(`No scope type defined in the <SCOPES /> component. Please add a type property with either "css" or "js"`);
    if (props.type != "\"css\"" && props.type != "\"js\"") throw new Error(`Unknown type ${props.type} in <SCOPES /> component. Please use either "css" or "js"`);
    const scopeType = props.type.slice(1, -1);
    let scopesUsed = scopes.filter(scope => scope.type == scopeType);
    const contents = scopesUsed.map(scopeUsed => {
        return {
            content: fs.readFileSync(scopeUsed.path, 'utf8'),
            path: scopeUsed.path
        };
    });
    const joinedContents = contents.map(content => {
        if (!isDev) return content.content;
        return `\n/* DEBUG: Start scoped ${scopeType} for file: ${path.relative(process.cwd(), content.path)} */\n` + content.content;
    }).join(isDev ? "\n" : "");
    return scopeType == "css" ? `<style>${joinedContents + (isDev ? "\n" : "")}\n</style>` : `<script>${joinedContents + (isDev ? "\n" : "")}</script>`;
}

export function handleScopes(code: string, scopes: Scope[], isDev: boolean): string {
    let output = "";
    let isInPhp = false;
    let isInString: false | "\"" | "'" = false;
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
        if (isInPhp && isInString == false && code[charIndex] == "\"") {
            isInString = "\"";
            output += "\"";
            continue;
        }
        if (isInPhp && isInString == "\"" && code[charIndex] == "\"") {
            isInString = false;
            output += "\"";
            continue;
        }
        if (isInPhp && isInString == false && code[charIndex] == "'") {
            isInString = "'";
            output += "'";
            continue;
        }
        if (isInPhp && isInString == "'" && code[charIndex] == "'") {
            isInString = false;
            output += "'";
            continue;
        }
        if ((match = code.slice(charIndex).match(REGEX.componentTag.scopes)) != null && !isInPhp) {
            let data = match[0].slice("<SCOPES".length, -2).trim();
            output += generateScopeCode(data, scopes, isDev);
            charIndex += match[0].length - 1;
            continue;
        }
        output += code[charIndex];
    }
    return output;
}