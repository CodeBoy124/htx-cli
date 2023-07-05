import { htxConfig } from "../config/config";
import REGEX from "./regex";

function processVariables(value: string, localComponentName: string, localUid: number, config: htxConfig): string {
    let output = "";

    let nestLevel = 0;
    let isInString: false | "\"" | "'" = false;

    for (let charIndex = 0; charIndex < value.length; charIndex++) {
        let match;
        if ((match = value.slice(charIndex).match(REGEX.variable.global)) != null && isInString == false) {
            output += "$" + match[0].slice("$GLOBAL_".length);
            charIndex += match[0].length - 1;
            continue;
        }
        if ((match = value.slice(charIndex).match(REGEX.variable.local)) != null && isInString == false) {
            output += "$" + config.constant.variable
                .replace("<component>", localComponentName)
                .replace("<uid>", localUid.toString())
                .replace("<variable>", match[0].slice(1));
            charIndex += match[0].length - 1;
            continue;
        }
        if (value[charIndex] == "(" && isInString == false) {
            nestLevel++;
        }
        if (value[charIndex] == ")" && isInString == false) {
            nestLevel--;
        }
        if (value[charIndex] == "{" && isInString == false) {
            nestLevel++;
        }
        if (value[charIndex] == "}" && isInString == false) {
            nestLevel--;
        }
        if (value[charIndex] == "[" && isInString == false) {
            nestLevel++;
        }
        if (value[charIndex] == "]" && isInString == false) {
            nestLevel--;
        }
        if (value[charIndex] == "\"" && isInString == false) {
            isInString = "\"";
        } else if (value[charIndex] == "\"" && isInString == "\"") {
            isInString = false;
        }
        if (value[charIndex] == "'" && isInString == false) {
            isInString = "'";
        } else if (value[charIndex] == "'" && isInString == "'") {
            isInString = false;
        }
        output += value[charIndex];
    }
    return output;
}

export function toPhpFormat(props: { [index: string]: string }, localComponentName: string, localUid: number, config: htxConfig): string {
    let outputParts: string[] = [];
    for (let key in props) {
        outputParts.push(`"${key}"=>${processVariables(props[key], localComponentName, localUid, config)}`);
    }
    return `[${outputParts.join(",")}]`;
}