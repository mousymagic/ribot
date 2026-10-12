/**
 * @file queueCommand.ts
 * @author lauraestupida
 * @license MIT
 */

import { SlashCommandBuilder, type APIEmbed } from "discord.js";
import { end } from "../types/effects";
import type { DiscordHandlers } from "../types/module";
import { getMediaUrl, type Channel, type PlaylistItem } from "../types/cytube";

const queueCommand =
    new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the playlist and what\'s currently playing.')

function playlistToEmbed(chan: Channel): APIEmbed {
    const cur = chan.currentMedia()

    const boldIfCur = (item: PlaylistItem, str: string) =>
        cur != undefined && item.uid == cur.uid ? `**${str}**` : str

    const itemToStr = (item: PlaylistItem, n: number) =>
        boldIfCur(item, `${n + 1}. [${item.media.title}](${getMediaUrl(item)})`)

    return {
        title: 'Queue',
        description: chan.playlist.map(itemToStr).join('\n')
    }
}

export const discordCommands = [queueCommand]

export const discordEvents: DiscordHandlers = {
    interactionCreate(state, interaction) {
        if(!interaction.isChatInputCommand())
            return end()
        
        if(interaction.commandName != queueCommand.name)
            return end()

        const chan = state.getCytubeFromDiscord(interaction.channelId)

        return ['replyInteraction', {
            interaction,
            contents:
                chan == undefined ? 'Oi mate, this channel aint bridged'
                : chan.playlist.length == 0 ? 'Playlist is empty'
                : { embeds: [playlistToEmbed(chan)] }
        }]
    },
}