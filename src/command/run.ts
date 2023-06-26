import fs from "fs";

import { readConfig } from "../config/config";

export default function Run() {
    console.log("Reading configuration");
    const config = readConfig();

    /*
    console.log(`Scanning for '.${config.extension.src}' files in '${config.directory.src}'`);
    const filesToConvert = scanForFiles(config);
    for (let fileFoundIndex = 0; fileFoundIndex < filesToConvert.length; fileFoundIndex++) {
        const file = filesToConvert[fileFoundIndex];
        console.log(`Processing file ${fileFoundIndex + 1}/${filesToConvert.length}: ${file}`);
        const fileContents = fs.readFileSync(file, 'utf8');
        const convertedContents = convertHtx(fileContents);
        const outputFile = generateOutputFilePath(file, config);
        fs.writeFileSync(outputFile, convertedContents);
    }*/
}