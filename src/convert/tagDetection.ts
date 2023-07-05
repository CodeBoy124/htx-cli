import REGEX from "./regex";
function isWrongTagClose(type: "/>" | ">", code: string, index: number): boolean {
    if (type == "/>") return code[index - 1] != "-" && code[index - 1] != "/" && code[index] == ">";
    return code[index - 2] != "-" && code[index - 1] == "/" && code[index] == ">";
}
function isRightTagClose(type: "/>" | ">", code: string, index: number) {
    if (type == "/>") return code[index - 1] != "-" && code[index] == "/" && code[index + 1] == ">";
    return code[index - 1] != "-" && code[index - 1] != "/" && code[index] == ">";
}

function isSpace(code: string, index: number) {
    return [" ", "\t", "\r", "\n"].includes(code[index]);
}
export function isTag(type: "/>" | ">", code: string, index: number = 0): false | {
    size: number,
    attr: { [key: string]: string },
    tagname: string
} {
    let startIndex = index;
    let match;
    if ((match = code.slice(index).match(REGEX.componentTag.open)) == null) return false;
    let tagname = match[0].slice(1);
    index += match[0].length;
    let expectSpace = true;
    let attr: { [key: string]: any } = {};
    let existSuccess = false;
    let partIndex;
    for (partIndex = index; partIndex < code.length; partIndex++) {
        if (isWrongTagClose(type, code, partIndex)) return false;
        if (isRightTagClose(type, code, partIndex)) {
            existSuccess = true;
            partIndex += (type == "/>") ? 2 : 1;
            break;
        }
        if (expectSpace && !isSpace(code, partIndex)) return false;
        if (expectSpace) {
            expectSpace = false;
            continue;
        }
        if ((match = code.slice(partIndex).match(REGEX.attributeStart)) != null) {
            let attrName = match[0].slice(0, -1);
            expectSpace = true;
            partIndex += match[0].length - 1;

            let nestLevel = 0;
            let isInString: false | "\"" | "'" = false;

            let charIndex = 1;
            let output = "";
            while (partIndex + charIndex < code.length) {
                if (code[partIndex + charIndex] == " " && nestLevel == 0 && isInString == false) {
                    break;
                }
                if (code[partIndex + charIndex] == "(" && isInString == false) {
                    nestLevel++;
                }
                if (code[partIndex + charIndex] == ")" && isInString == false) {
                    nestLevel--;
                }
                if (code[partIndex + charIndex] == "{" && isInString == false) {
                    nestLevel++;
                }
                if (code[partIndex + charIndex] == "}" && isInString == false) {
                    nestLevel--;
                }
                if (code[partIndex + charIndex] == "[" && isInString == false) {
                    nestLevel++;
                }
                if (code[partIndex + charIndex] == "]" && isInString == false) {
                    nestLevel--;
                }
                if (code[partIndex + charIndex] == "\"" && isInString == false) {
                    isInString = "\"";
                } else if (code[partIndex + charIndex] == "\"" && isInString == "\"") {
                    isInString = false;
                }
                if (code[partIndex + charIndex] == "'" && isInString == false) {
                    isInString = "'";
                } else if (code[partIndex + charIndex] == "'" && isInString == "'") {
                    isInString = false;
                }
                output += code[partIndex + charIndex];
                charIndex++;
                if (nestLevel == 0 && isInString == false && code.slice(partIndex + charIndex).startsWith((type == "/>") ? "/>" : ">") && code[partIndex + charIndex - 1] != "-") {
                    if (type == ">" && code[partIndex + charIndex - 1] == "/") continue;
                    partIndex += charIndex - 1;
                    attr[attrName] = output;
                    return {
                        size: (partIndex - startIndex) + ((type == "/>") ? 3 : 2),
                        attr,
                        tagname
                    };
                }
            }
            partIndex += charIndex - 1;
            attr[attrName] = output;
            continue;
        }
        if (![" ", "\t", "\r", "\n"].includes(code[partIndex])) return false;
    }
    if (!existSuccess) return false;
    return {
        size: partIndex - startIndex,
        attr,
        tagname
    };
}