/**
 * @file state.ts
 * @author lauraestupida
 * @license MIT
 * 
 * The entire state of the bot
 */

import * as cytube from './cytube'

import { Socket } from 'socket.io-client'

export type State = {
    // Cytube auth information
    host: string,
    port: string, secure: boolean,
    username: string,
    password: string,
    channel: string,
    channelPassword?: string,

    // Cytube session
    socket: Socket,
    emotes: cytube.EmotePayload[]
    
    // Discord auth
    webhook?: string,
    token: string
}