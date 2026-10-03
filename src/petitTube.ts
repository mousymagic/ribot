/**
 * @file petitTube.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Adds integration with PetitTube to add random videos cuz they figured out all
 * the hard stuff xd
 */

import type { ChatMsgPayload } from "./types/cytube";
import { Nothing, type Effect, type Module } from "./types/effects";
import type { State } from "./types/state";

const petitRegex = /<iframe id="player" src="https:\/\/www.youtube.com\/embed\/([^?]+)\?version=3&f=videos&app=youtube_gdata&enablejsapi=1" allow="autoplay" allowfullscreen><\/iframe>/

function onChatMsg({ msg }: ChatMsgPayload, state: State): Effect {
    if (msg != '!random')
        return Nothing

    return {
        kind: 'httpRequest',
        request: new Request('https://petittube.com/'),
        handle: (text, state): Effect => {
            const regex = petitRegex.exec(text)
            if(regex == null || regex[1] == undefined)
                return Nothing
            
            return { kind: 'addYt', id: regex[1] }
        }
    }
}

export const module: Module = {
    events: {},
    cytubeEvents: {
        chatMsg: onChatMsg
    }
}