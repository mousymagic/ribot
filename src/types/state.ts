/**
 * @file state.ts
 * @author lauraestupida
 * @license MIT
 * 
 * The bot internal state that shouldn't be modified
 */

import type { Socket } from "socket.io-client"
import type { Effect } from "./effects"
import type { Channel, CytubeOutgoing, MessagePayload, User } from "./cytube"
import type { EventEmitter } from 'node:events'
import type { Module } from "./module"

export interface State {}

/**
 * Events a CyTube instance might emit to the modules
 */
export type ChannelEvents = {
    chatMsg: MessagePayload
}

/**
 * The state each CyTube instance manages
 */

export type SocketState = Channel & {
    readonly socket: Socket,
    status: 'unconnected' | 'connected' | 'logged',
    started: Date,

    newState(next: Partial<SocketState>): Effect<'socketstate'>
    emit<E extends keyof ChannelEvents>(event: E, data: ChannelEvents[E]):
        Effect<'channelevent'>

    /**
     * Sends an event to the socket
     */
    send<E extends keyof CytubeOutgoing>(event: E, payload: CytubeOutgoing[E]):
        Effect<'socketemit'>
    
    updateUser(name: string, userinfo: Partial<User>):
        Effect<'socketstate'> | null
}

/**
 * State of the entire bot
 */
export type BotState = State & {
    /**
     * Each connection to a channel needs its own socket
     */
    channels: {[name: string]: SocketState},
    emitter: EventEmitter
}