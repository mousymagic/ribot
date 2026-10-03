/**
 * @file state.ts
 * @author lauraestupida
 * @license MIT
 * 
 * The entire state of the bot
 */

import * as cytube from './cytube'

export type State = {
    // Cytube auth information
    host: string,
    port: string, secure: boolean,
    username: string,
    password: string,
    channel: string,
    channelPassword?: string,

    // Cytube session
    emotes: cytube.EmotePayload[]
    
    // Discord auth
    webhook?: string
}