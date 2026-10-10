import { io, type Socket } from 'socket.io-client'
import { type Effect, type Argument, type ResponseType, type Kind } from './types/effects'
import type { State, SocketState, BotState } from './types/state'
import { eventHandler, socketState } from './cytubeProtocol'
import EventEmitter from 'node:events'
import type { Module } from './types/module'

type Config = {
    channels: {[name: string]: {
        host?: string,
        port?: string,
        secure?: boolean
        username: string,
        password: string,
        webhook: string
    }},
    discord: {
        token: string
    }
}

const config: Config = require('../config.toml')

/**
 * What each effect does. This is the part that has side effects
 */
const handlers: {[k in Kind]: (_: Argument<k>, state: BotState) =>
    ResponseType<k> extends null ? void : Promise<ResponseType<k>>}
= {
    // Monadic stuff
    chain: async ({ unit, binds }, state) => {
        let effect: Effect = unit
        if(effect[0] == 'end')
            return commit(effect, state)

        let response = await commit(effect, state)
        for(const fn of binds) {
            effect = fn(response as never)
            if(effect[0] == 'end')
                return commit(effect, state)

            response = await commit(effect, state)
        }
    },
    end: ({ unit }, state) => {if (unit != null) commit(unit, state)},
    error: str => {throw new Error(str)},

    // Regular stuff
    http: r => fetch(r),
    body: r => r.text(),
    log: (text) => console.log(`[Log]: ${text}`),

    // Internal super secret stuff
    socketemit: async ({ name: channelname, event, message }, state) => {
        const channel = state.channels[channelname]
        if(channel == undefined)
            throw new Error(`Tried to emit ${event}: ${message} to channel \
${channelname} (doesn't exist)`);
        console.log(`${channelname} => [${event}]: ${JSON.stringify(message, null, 4)}`)
        channel.socket.emit(event, message)
    },
    socketstate: async ({ name: channelname, next }, state) => {
        const channel = state.channels[channelname]
        if(channel == undefined)
            throw new Error(`Cant edit ${channelname}'s state (doesnt exist)`)
        console.log(`[State]: ${JSON.stringify(next, null, 4)}`)

        state.channels[channelname] = {...channel, ...next}
        return state.channels[channelname]
    },
    channelevent: ({ name, event, data }) => {
        const channel = state.channels[name]
        if(channel == undefined)
            throw new Error(`${name}'s channel aint real`)
        state.emitter.emit(event, data, channel, state)
    }
}

/**
 * Performs an effect
 */
async function commit(
    e: Effect<Kind>, state: BotState
): Promise<ResponseType<Kind>> {
    return await handlers[e[0]](e[1] as any, state) as any
}

/**
 * From now on what remains is the actual initialization of the bot
 */
const state: BotState = {
    emitter: new EventEmitter(),
    channels: {}
}

// Log into CyTube channels
for(const [name, info] of Object.entries(config.channels)) {
    const ss = socketState(
        io('https://bigapple.cytu.be:8443'),
        name,
        info.username,
        info.password,
        info.webhook
    )
    state.channels[name] = ss

    for(const [event, handler] of Object.entries(eventHandler)) {
        ss.socket.on(event, (arg: Parameters<typeof handler>[0]) => {
            const effect = handler(arg, state.channels[name])
            commit(effect, state)
        })
    }
}

// Initialize modules
const modules: Module[] = [require('./modules/discordBridge')]

for(const { channelEvents } of modules) {
    if(channelEvents == undefined)
        continue
    
    for(const [event, handler] of Object.entries(channelEvents)) {
        state.emitter.on(event, (...args: Parameters<typeof handler>) => {
            const effect = handler(...args)
            commit(effect, state)
        })
    }
}
