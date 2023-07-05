export default {
    php: {
        open: /^<\?(php|=)/,
        close: /^\?>/
    },
    variable: {
        global: /^\$GLOBAL_[A-Za-z0-9_$]+/,
        local: /^\$[A-Za-z0-9_$]+/,
    },
    function: {
        define: /^function [A-Za-z0-9_]+\(/,
        call: /^[A-Za-z0-9_]+\(/
    },
    importStatement: /^<!-- ?import ([A-Za-z0-9$./_-]+ from )?"[^"\n]+" ?-->/,
    attributeStart: /^[A-Za-z0-9_\-$]+\=/,
    componentTag: {
        open: /^<[A-Z][A-Za-z0-9\-_$]*/,
        close: /^<\/[A-Z][A-Za-z0-9\-_$]*[\n ]*>/,
        children: /^<INNER *\/?>/,
        scopes: /^<SCOPES*( [^>]*)?\/>/
    }
};