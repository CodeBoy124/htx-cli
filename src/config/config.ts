export const configFileLocation = "./htx_config.json";

export default {
    environment: "dev",
    extension: {
        src: "htx",
        out: "php"
    },
    directory: {
        src: "./src/pages",
        out: "./out"
    },
    constant: {
        variable: "htx_<component>_<uid>_<variable>",
        props: "props"
    }
}