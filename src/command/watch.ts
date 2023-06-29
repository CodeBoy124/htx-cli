import fs from "fs";
import path from "path";

import runCommand from "./run";

const waitingChangeTimeSeconds = 5;
export default function Watch(argv: any) {
    const actualFolderToWatch = path.join(process.cwd(), argv.folder);
    let watchChangeTimeout: any;
    fs.watch(actualFolderToWatch, {
        recursive: true
    }, (eventType, filename) => {
        if (!watchChangeTimeout) {
            if (eventType != "change") return;
            console.log(`Change detected for file "${filename}"`);
            runCommand();
            watchChangeTimeout = setTimeout(() => { watchChangeTimeout = null; }, waitingChangeTimeSeconds * 1000);
        }
    });
    runCommand();
}