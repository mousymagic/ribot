/**
 * Not a perfect world. Everyone has to come out of their pure mathematical land
 * into the real dirty world. Look at the script am forced to write, mother,
 * look at the unelegance of adding another step to setting the bot up.
 */

import { ApplicationIntegrationType, REST, Routes, SlashCommandBuilder } from "discord.js";
import { readdir } from "node:fs/promises";
import type { Module } from "./src/types/module";

const { discord: {token, appId} } = require('./config.toml')

const modules = await readdir('./src/modules')

const commands =
    modules
    .map(pkg => require(`./src/modules/${pkg}`))
    .map((m: Module) => m.discordCommands)
    .filter(c => c != undefined)
    .flatMap((cmds: SlashCommandBuilder[]) => cmds.map(cmd => cmd.toJSON()))

const rest = new REST().setToken(token)

await rest.put(Routes.applicationCommands(appId), {body: commands})
