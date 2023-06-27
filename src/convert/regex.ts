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
    componentTag: {
        open: /^<[A-Z][A-Za-z0-9\-_$]*( [^>]*[^/])?>/,
        close: /^<\/[A-Z][A-Za-z0-9\-_$]*[\n ]*>/,
        single: /^<[A-Z][A-Za-z0-9\-_$]*( [^>]*)?\/>/,
        children: /^<INNER *\/?>/
    }
};