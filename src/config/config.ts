import fs from "fs";
import path from "path";

export const configFileLocation = "./htx_config.json";

export type htxConfig = {
    environment: "dev" | "prod",
    extension: {
        src: string,
        out: string
    },
    directory: {
        src: string,
        out: string
    },
    constant: {
        variable: string,
        props: string
    }
};

type jsObject = { [index: string | number | symbol]: any };
function fillConfiguration(defaults: jsObject, value: jsObject) {
    const keys = Object.keys(defaults);
    for (const key of keys) {
        if (key in value) {
            if (typeof (value[key]) == "object") {
                defaults[key] = fillConfiguration(defaults[key], value[key]);
            } else {
                defaults[key] = (typeof (value[key]) == "object") ?
                    fillConfiguration(defaults[key], value[key]) :
                    value[key];
            }
        }
    }
    return defaults;
}

export function readConfig(): htxConfig {
    const rootPath = process.cwd();
    const configFilePath = path.join(rootPath, configFileLocation);
    if (fs.existsSync(configFilePath)) {
        console.log(`Using '${configFileLocation}' file for configuration`);
        const fileContents = fs.readFileSync(configFilePath, 'utf8');
        const customConfig = JSON.parse(fileContents);
        const finalConfig = fillConfiguration(defaultConfig, customConfig);
        return finalConfig as htxConfig;
    }
    console.log(`Using default config`);
    return defaultConfig;
}

const defaultConfig: htxConfig = {
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
};
export default defaultConfig;