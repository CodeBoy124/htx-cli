import { htxConfig } from "../config/config";

type Token = {
    type: "string" | "assign" | "whitespace" | "text",
    value?: string
}

const REGEX = {
    whitespace: /^[ \n\r\t]+/,
    boolean: /^true|false$/,
    number: /^[0-9.]+$/
}

function parseValue(value: string) {
    if (value[0] == "$") {
        return value;
    }
    if (REGEX.boolean.test(value)) {
        return value == "true";
    }
    if (REGEX.number.test(value)) {
        return parseFloat(value);
    }
    throw new Error(`Cannot parse value "${value}"`);
}

function valueToPhp(value: any, localComponentName: string, localUid: number, config: htxConfig): string {
    if (typeof (value) == "boolean" || typeof (value) == "number") {
        return value.toString();
    }
    if (typeof (value) == "string") {
        if (value[0] == "$") {
            let [variableName, ...dataParts] = value.split(".");
            return "$" + config.constant.variable
                .replace("<component>", localComponentName)
                .replace("<uid>", localUid.toString())
                .replace("<variable>", variableName.slice(1)) + ((dataParts.length > 0) ? (dataParts.map(dataPart => `["${dataPart}"]`).join("")) : "");
        }
        if (
            (value[0] != "\"" && value[0] != "'") ||
            (value[value.length - 1] != "\"" && value[value.length - 1] != "'")
        ) throw new Error(`property value (${value}) of type string does not have any quotes.`);
        return value;
    }
    if (typeof (value) == "object" && value != null) {
        return toPhpFormat(value, localComponentName, localUid, config);
    }
    throw new Error(`Cannot convert type "${typeof (value)}" for value "${value}" to a php equivalent`);
}

export function toPhpFormat(props: { [index: string]: any }, localComponentName: string, localUid: number, config: htxConfig): string {
    let outputParts: string[] = [];
    for (let key in props) {
        outputParts.push(`"${key}"=>${valueToPhp(props[key], localComponentName, localUid, config)}`);
    }
    return `[${outputParts.join(",")}]`;
}

function lexer(str: string): Token[] {
    let tokens: Token[] = [];
    let isInString: false | "\"" | "'" = false;

    let skipNext = false;

    for (let charIndex = 0; charIndex < str.length; charIndex++) {
        let currentChar = str[charIndex];

        skipNext = currentChar == "\\";

        // handle strings
        if (currentChar == "\"" && isInString == false) {
            isInString = "\"";
            tokens.push({
                type: "string",
                value: ""
            });
            continue;
        }
        if (currentChar == "\"" && isInString == "\"" && !skipNext) {
            isInString = false;
            continue;
        }

        if (currentChar == "'" && isInString == false) {
            isInString = "'";
            tokens.push({
                type: "string",
                value: ""
            });
            continue;
        }
        if (currentChar == "'" && isInString == "'" && !skipNext) {
            isInString = false;
            continue;
        }

        if (isInString != false) {
            if (tokens.length < 1) throw new Error("Cannot add string contents to any token. Consider opening a string first");
            if (tokens[tokens.length - 1].type != "string") throw new Error("Cannot add string content to a non-string token");
            tokens[tokens.length - 1].value += currentChar;
            continue;
        }

        if (currentChar == "=") {
            tokens.push({
                type: "assign"
            });
            continue;
        }

        let match;
        if ((match = str.slice(charIndex).match(REGEX.whitespace)) != null) {
            tokens.push({
                type: "whitespace",
                value: match[0]
            });
            charIndex += match[0].length - 1;
            continue;
        }

        if (tokens.length > 0 && tokens[tokens.length - 1].type == "text") {
            tokens[tokens.length - 1].value += currentChar;
            continue;
        }
        tokens.push({
            type: "text",
            value: currentChar
        });
    }
    return tokens;
}
function parser(tokens: Token[]): { [index: string]: any } {
    let attributes: { [index: string]: any } = {};
    for (let tokenId = 0; tokenId < tokens.length; tokenId++) {
        let currentToken = tokens[tokenId];
        if (currentToken.type == "whitespace") continue;
        if (currentToken.type == "text") {
            if (tokenId + 1 >= tokens.length) {
                if (currentToken.value == undefined) throw new Error("Cannot create attribute without name");
                attributes[currentToken.value] = true;
                continue;
            }

            let nextToken = tokens[tokenId + 1];
            if (nextToken.type != "assign") throw new Error(`Unexpected type "${nextToken.type}" after attribute name "${currentToken.value}"`);
            if (tokenId + 2 >= tokens.length) throw new Error(`Unexpected ending for attribute "${currentToken.value}"`);
            let nextNextToken = tokens[tokenId + 2];
            if (nextNextToken.type != "text" && nextNextToken.type != "string") throw new Error(`Cannot assign type "${nextNextToken.type}" to attribute "${currentToken.value}"`);
            if (currentToken.value == undefined) throw new Error("Cannot assign a value to an unnamed attribute");
            if (nextNextToken.value == undefined) throw new Error(`Cannot assign empty to attribute "${currentToken.value}"`);
            attributes[currentToken.value] = (nextNextToken.type == "text") ? parseValue(nextNextToken.value) : `"${nextNextToken.value}"`;
            tokenId += 2;
            continue;
        }
        throw new Error(`Unexpected token type "${currentToken.type}". Expected either a whitespace or some text (an attribute name)`);
    }
    return attributes;
}
export default function parseHtmlAttributes(attrString: string): { [index: string]: any } {
    let tokens = lexer(attrString);
    let parsed = parser(tokens);
    return parsed;
}