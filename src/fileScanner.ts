import FindFiles from "node-find-files";

import path from "path";

import { htxConfig } from "./config/config";

export default function scanForFiles(config: htxConfig) {
    return new Promise<string[]>((res, rej) => {
        let finder = new FindFiles({
            rootFolder: path.join(process.cwd(), config.directory.src),
            filterFunction(strPath) {
                return strPath.endsWith("." + config.extension.src)
            },
        });
        let files: string[] = [];
        finder.on("match", strPath => {
            files.push(strPath);
        });
        finder.on("complete", () => {
            res(files);
        });
        finder.on("patherror", rej);
        finder.on("error", rej);
        finder.startSearch();
    });
}