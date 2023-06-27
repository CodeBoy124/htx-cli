#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import runCommand from "./command/run";
import watchCommand from "./command/watch";
import initCommand from "./command/init";

yargs(hideBin(process.argv))
    .command(["$0", "run"], "Convert htx files to regular php", () => { }, runCommand)
    .command("watch [folder]", "Convert htx files to regular php and update when changes are detected", yargs => {
        yargs.positional("folder", {
            type: "string",
            default: "./",
            describe: "The folder to watch"
        });
    }, watchCommand)
    .command("init", "Initialize a 'htx_config.json' file", () => { }, initCommand)
    .parse();