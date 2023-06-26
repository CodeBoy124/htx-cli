import fs from "fs";
import path from "path";

import { htxConfig, readConfig } from "../config/config";
import scanForFiles from "../fileScanner";

function generateOutputFilePath(file: string, config: htxConfig) {
    const rootPath = process.cwd();
    const srcRoot = path.join(rootPath, config.directory.src);
    const relativeFilePath = path.relative(srcRoot, file);
    const parentFolder = path.dirname(relativeFilePath);
    const filenName = path.basename(relativeFilePath, "." + config.extension.src);
    const outputPath = path.join(rootPath, config.directory.out, parentFolder, filenName + "." + config.extension.out);
    return outputPath;
}

export default async function Run() {
    console.log("Reading configuration");
    const config = readConfig();

    console.log(`Scanning for '.${config.extension.src}' files in '${config.directory.src}'`);
    const filesToConvert = await scanForFiles(config);

    for (let fileFoundIndex = 0; fileFoundIndex < filesToConvert.length; fileFoundIndex++) {
        const file = filesToConvert[fileFoundIndex];
        console.log(`Processing file ${fileFoundIndex + 1}/${filesToConvert.length}: ${file}`);
        const fileContents = fs.readFileSync(file, 'utf8');
        const outputFile = generateOutputFilePath(file, config);
        //const convertedContents = convertHtx(fileContents);
        //fs.writeFileSync(outputFile, convertedContents);
    }
}