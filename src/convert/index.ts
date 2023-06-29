import fs from "fs";
import path from "path";

import { htxConfig } from "../config/config";

import REGEX from "./regex";
import parseHtmlAttributes, { toPhpFormat } from "./parse";
import { Scope, checkForExistingScopes, handleScopes } from "./scopes";

function usesFromImportSyntax(importParamaters: string[]): boolean {
    return importParamaters.length >= 3 && importParamaters[1] == "from";
}
function parseImportStatement(match: string, config: htxConfig) {
    let importParamaters = match.slice("<!--".length, -"-->".length).trim().slice("import ".length).split(" ");
    if (usesFromImportSyntax(importParamaters)) {
        return {
            name: importParamaters[0],
            file: importParamaters.slice(2).join(" ").slice(1, -1) + "." + config.extension.src,
            fileNameWithoutExtension: importParamaters.slice(2).join(" ").slice(1, -1)
        };
    }
    let fileNameWithoutExtension = importParamaters.join(" ").slice(1, -1);
    return {
        name: path.basename(fileNameWithoutExtension),
        file: fileNameWithoutExtension + "." + config.extension.src,
        fileNameWithoutExtension: fileNameWithoutExtension
    };
}

function convert(code: string, uid: number, props: { [index: string]: any }, children = "", config: htxConfig, filePath: string, parentComponentName: string, parentUid: number, isRoot: boolean = false): {
    output: string,
    uid: number
} {
    const localComponentName = path.basename(filePath).slice(0, -("." + config.extension.src).length);
    const localUid = uid;

    let components: {
        [index: string]: {
            relativePath: string,
            contents: string
        }
    } = {};
    let componentChildStack: [{
        component: string | null,
        attr: { [index: string]: any },
        children: string
    }] = [{
        component: null,
        attr: {},
        children: ""
    }];
    const addToOutput = (...content: string[]) => {
        componentChildStack[componentChildStack.length - 1].children += content.join("");
    }

    let localFunctions: string[] = [];

    let possibleScopedCssFiles: Set<string> = new Set();
    let possibleScopedJsFiles: Set<string> = new Set();

    let isInPhp = false;
    let isInString: false | `"` | `'` = false;

    for (let charIndex = 0; charIndex < code.length; charIndex++) {
        let match;

        // handle php open and close
        if ((match = code.slice(charIndex).match(REGEX.php.open)) != null && isInString == false) {
            isInPhp = true;
            addToOutput(match[0]);
            charIndex += match[0].length - 1;
            continue;
        }
        if ((match = code.slice(charIndex).match(REGEX.php.close)) != null && isInString == false) {
            isInPhp = false;
            addToOutput(match[0]);
            charIndex += match[0].length - 1;
            continue;
        }

        // hanlde php string
        if (isInPhp && code[charIndex] == "\"" && !isInString) {
            isInString = "\"";
            addToOutput("\"");
            continue;
        }
        if (isInPhp && code[charIndex] == "\"" && isInString == "\"") {
            isInString = false;
            addToOutput("\"");
            continue;
        }
        if (isInPhp && code[charIndex] == "'" && !isInString) {
            isInString = "'";
            addToOutput("'");
            continue;
        }
        if (isInPhp && code[charIndex] == "'" && isInString == "'") {
            isInString = false;
            addToOutput("'");
            continue;
        }

        // import statement
        if ((match = code.slice(charIndex).match(REGEX.importStatement)) != null && !isInPhp) {
            let { name: componentName, file: componentFileName, fileNameWithoutExtension } = parseImportStatement(match[0], config);
            components[componentName] = {
                relativePath: path.relative(process.cwd(), path.join(path.dirname(filePath), componentFileName)),
                contents: fs.readFileSync(path.join(path.dirname(filePath), componentFileName), 'utf8')
            };
            const fullPathToFileBase = path.join(path.dirname(filePath), fileNameWithoutExtension);
            possibleScopedCssFiles.add(fullPathToFileBase + ".css");
            possibleScopedJsFiles.add(fullPathToFileBase + ".js");
            charIndex += match[0].length - 1;
            continue;
        }

        // Component children
        if ((match = code.slice(charIndex).match(REGEX.componentTag.children)) != null && !isInPhp) {
            let childrenString = "";
            if (config.environment == "dev") {
                childrenString += `\n<!-- DEBUG: Children start ${localComponentName} #${localUid} -->\n`;
            }
            childrenString += children;
            if (config.environment == "dev") {
                childrenString += `\n<!-- DEBUG: Children end ${localComponentName} #${localUid} -->\n`;
            }
            addToOutput(childrenString);
            charIndex += match[0].length - 1;
            continue;
        }

        // Component scopes
        if ((match = code.slice(charIndex).match(REGEX.componentTag.scopes)) != null && !isInPhp) {
            if (config.environment == "dev") addToOutput("\n<!-- DEBUG: Start scopes -->\n");
            addToOutput(match[0]);
            if (config.environment == "dev") addToOutput("\n<!-- DEBUG: End scopes -->\n");
            charIndex += match[0].length - 1;
            continue;
        }

        // Component open
        if ((match = code.slice(charIndex).match(REGEX.componentTag.open)) != null && !isInPhp) {
            let [tagname, ...dataSplit] = match[0].slice(1, -1).trim().split(" ");
            let data = dataSplit.join(" ").trim();
            componentChildStack.push({
                component: tagname,
                attr: parseHtmlAttributes(data),
                children: ""
            });
            charIndex += match[0].length - 1;
            continue;
        }

        // Component close
        if ((match = code.slice(charIndex).match(REGEX.componentTag.close)) != null && !isInPhp) {
            let currentChildStackContent = componentChildStack.pop();
            uid++;
            if (currentChildStackContent?.component == null) throw new Error(`Cannot access component without a name`);
            if (!(currentChildStackContent?.component in components)) throw new Error(`Unknown component "${currentChildStackContent?.component}"`);
            let { output: converted, uid: newUid } = convert(components[currentChildStackContent?.component].contents, uid, currentChildStackContent?.attr, currentChildStackContent?.children, config, components[currentChildStackContent?.component].relativePath, localComponentName, localUid);
            uid = newUid;
            addToOutput(converted)
            charIndex += match[0].length - 1;
            continue;
        }

        // Component single
        if ((match = code.slice(charIndex).match(REGEX.componentTag.single)) != null && !isInPhp) {
            let [tagname, ...dataSplit] = match[0].slice(1, -2).trim().split(" ");
            let data = dataSplit.join(" ").trim();
            uid++;
            if (!(tagname in components)) {
                throw new Error(`Unknown component "${tagname}" in file "${filePath}"`);
            }
            let { output: converted, uid: newUid } = convert(components[tagname].contents, uid, parseHtmlAttributes(data), "", config, components[tagname].relativePath, localComponentName, localUid);
            uid = newUid;
            addToOutput(converted);
            charIndex += match[0].length - 1;
            continue;
        }

        // Global variable
        if ((match = code.slice(charIndex).match(REGEX.variable.global)) != null && isInPhp && isInString == false) {
            addToOutput("$" + match[0].slice("$GLOBAL_".length));
            charIndex += match[0].length - 1;
            continue;
        }

        // Local variable
        if ((match = code.slice(charIndex).match(REGEX.variable.local)) != null && isInPhp && isInString == false) {
            addToOutput("$" + config.constant.variable
                .replace("<component>", localComponentName)
                .replace("<uid>", localUid.toString())
                .replace("<variable>", match[0].slice(1))
            );
            charIndex += match[0].length - 1;
            continue;
        }

        // Create local function
        if ((match = code.slice(charIndex).match(REGEX.function.define)) != null && isInPhp && isInString == false) {
            const functionName = match[0].slice("function ".length, -1).trim();
            if (functionName.startsWith("GLOBAL_")) {
                addToOutput(`function ${functionName.slice("GLOBAL_".length)}(`);
                charIndex += match[0].length - 1;
                continue;
            }
            localFunctions.push(functionName);
            addToOutput(`function ${config.constant.variable
                .replace("<component>", localComponentName)
                .replace("<uid>", localUid.toString())
                .replace("<variable>", functionName)}(`);
            charIndex += match[0].length - 1;
            continue;
        }
        if ((match = code.slice(charIndex).match(REGEX.function.call)) != null && isInPhp && isInString == false) {
            const functionName = match[0].slice(0, -1).trim();
            if ((!functionName.startsWith("GLOBAL_")) && localFunctions.includes(functionName)) {
                addToOutput(config.constant.variable
                    .replace("<component>", localComponentName)
                    .replace("<uid>", localUid.toString())
                    .replace("<variable>", functionName) + "(");
            } else if (functionName.startsWith("GLOBAL_")) {
                addToOutput(functionName.slice("GLOBAL_".length) + "(");
            } else {
                addToOutput(functionName + "(");
            }
            charIndex += match[0].length - 1;
            continue;
        }
        addToOutput(code[charIndex]);
    }

    let existingScopes;
    if (isRoot)
        existingScopes = checkForExistingScopes(possibleScopedCssFiles, possibleScopedJsFiles);

    let finalOutput = (config.environment == "dev") ? `\n<!-- DEBUG: Start ${localComponentName} #${localUid} -->\n` : "";
    if (Object.keys(props).length > 0) {
        finalOutput += `<?php ${"$" + config.constant.variable
            .replace("<component>", localComponentName)
            .replace("<uid>", localUid.toString())
            .replace("<variable>", config.constant.props)} = ${toPhpFormat(props, parentComponentName, parentUid, config)}; ?>`;
    }
    finalOutput += isRoot ? handleScopes(componentChildStack[0].children, existingScopes as Scope[], config.environment == "dev") : componentChildStack[0].children;
    if (config.environment == "dev") {
        finalOutput += `\n<!-- DEBUG: End ${localComponentName} #${localUid} -->\n`;
    }
    return {
        output: finalOutput,
        uid
    };
}

export function convertHtx(contents: string, filePath: string, config: htxConfig): string {
    const converted = convert(contents, 0, {}, "", config, filePath, "", -1, true).output;
    return converted.split("\n").filter(line => line.replace(/\r/g, "").trim() != "").join("\n");
}