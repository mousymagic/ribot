/**
 * @file state.ts
 * @author lauraestupida
 * @license MIT
 * 
 * The entire state of the bot
 */

import * as cytube from './cytube'

import { EventEmitter } from 'node:events'
import { Socket } from 'socket.io-client'

export type State = {
    events: EventEmitter,

    // Cytube auth information
    host: string,
    port: string, secure: boolean,
    username: string,
    password: string,
    channel: string,
    channelPassword?: string,

    // Cytube session
    socket: Socket,
    emotes: cytube.EmotePayload[],
    playlist: cytube.QueueItem[],
    currentItem: number,
    rank: cytube.UserRank,
    permissions?: cytube.Permissions,
    leader: string,
    
    // Discord auth
    webhook?: string,
    token: string
}