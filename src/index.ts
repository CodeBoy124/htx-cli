#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import runCommand from "./command/run";
import initCommand from "./command/init";

yargs(hideBin(process.argv))
    .command(["$0", "run"], "Convert htx files to regular php", () => { }, runCommand)
    .command("init", "Initialize a 'htx_config.json' file", () => { }, initCommand)
    .parse();