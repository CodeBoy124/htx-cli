import fs from "fs";
import path from "path";

export const configFileLocation = "./htx_config.json";

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

export function readConfig() {
    const rootPath = process.cwd();
    const configFilePath = path.join(rootPath, configFileLocation);
    if (fs.existsSync(configFilePath)) {
        console.log(`Using '${configFileLocation}' file for configuration`);
        const fileContents = fs.readFileSync(configFilePath, 'utf8');
        const customConfig = JSON.parse(fileContents);
        const finalConfig = fillConfiguration(defaultConfig, customConfig);
        return finalConfig;
    }
    console.log(`Using default config`);
    return defaultConfig;
}

const defaultConfig = {
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