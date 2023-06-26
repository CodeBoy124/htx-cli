import fs from "fs";
import path from "path";

import defaultConfig, { configFileLocation } from "../config/config";

export default function Init() {
    const rootPath = process.cwd();
    const configFilePath = path.join(rootPath, configFileLocation);
    const defaultConfigString = JSON.stringify(defaultConfig, null, 2);
    fs.writeFile(configFilePath, defaultConfigString, (err) => {
        if (err) {
            console.error(`Could not create '${configFileLocation}', because of the following error:\n${err}`);
            process.exit(1);
        }
        console.log(`Created '${configFileLocation}'`);
    })
}