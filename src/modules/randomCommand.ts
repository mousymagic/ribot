/**
 * @file randomCommand.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Adds random videos from PetitTube and stuff
 */

import type { Channel } from "../types/cytube";
import { bind, end, type Effect } from "../types/effects";
import type { ChannelHandlers } from "../types/module";

const petitRegex = /<iframe id="player" src="https:\/\/www.youtube.com\/embed\/([^?]+)\?version=3&f=videos&app=youtube_gdata&enablejsapi=1" allow="autoplay" allowfullscreen><\/iframe>/

function addRandomVideo(channel: Channel): Effect {
    return bind(
        ['http', new Request('https://petittube.com/')],
        response =>
            response.ok ? ['body', response] : end(),
        body => {
            const regex = petitRegex.exec(body)
            if(regex == null || regex[1] == null)
                return end()

            return bind(
                channel.addVideo('yt', regex[1]),
                _ => channel.newState({ lastAddedRandomVideo: regex[1] })
            )
        }
    )
}

export const channelEvents: ChannelHandlers = {
    chatMsg({ msg }, channel) {
        if(msg != '/random')
            return end()

        if(channel.lastAddedRandomVideo != null) {
            return bind(
                channel.newState({lastAddedRandomVideo: null}),
                _ => channel.sendMessage('Wont send random videos anymore')
            )
        }

        return bind(
            channel.newState({lastAddedRandomVideo: ''}),
            _ => addRandomVideo(channel)
        )
    },
    setCurrent: ({ media: { id } }, channel) =>
        id == channel.lastAddedRandomVideo ? addRandomVideo(channel) : end(),
}