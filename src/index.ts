/**
 * @file index.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Entry point of the bot. All initialization and side effects are done here
 */

import type { State } from './types/state'
import type { Effect, Module } from './types/effects'
import type { EmotePayload, UserRank } from './types/cytube'

import { config } from '../config'
import { io } from 'socket.io-client'

let state: State = {
    host: config.host,
    port: config.port, secure: config.secure,
    username: config.username,
    password: config.password,
    channel: config.channel,
    channelPassword: undefined,

    emotes: [],

    webhook: config.webhook
}

function commitSideEffect(effect: Effect) {
    switch(effect.kind) {
        case 'nothing':
            break
        case 'httpRequest':
            fetch(effect.request)
            break
    }
}

let modules: Module[] = [require('./webhookIntegration').module]

// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/client.js
// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/ponkbot.js

function socketUrl({secure, host, port, channel}: State) {
    return (
        `${secure ? 'https' : 'http'}://${host}:${port}/` +
        `socketconfig/${channel}.json`
    )
}

/*
const response = await fetch(socketUrl(config))
const text = await response.json()
*/

const text = {
  servers: [
    {
      url: "https://bigapple.cytu.be:8443",
      secure: true,
    }, {
      url: "http://bigapple.cytu.be:8880",
      secure: false,
    }
  ],
}

const socket = io(text.servers[0]?.url)

socket.on('error', err => {throw new Error(err)})

socket.once('connect', () => {
    console.log("Connecting...")
    socket.emit('joinChannel', { name: state.channel })
    socket.once('needPassword', () => {
        throw new Error('Channel requires password. Not supported yet.')
    })
    socket.once('rank', (rank: UserRank) => {
        console.log("  Sending credentials...")
        socket.emit('login', {
            name: state.username,
            pw: state.password
        })
    })

    // Useful for debugging.
    socket.onAny((event, arg) => {
        console.log(`[${event}]: ${JSON.stringify(arg, null, 4)}`)
    })
})

socket.on('emoteList', (data: EmotePayload[]) => {
    state.emotes = data
})

socket.once('login', (data) => {
    if(!data.success) {
        throw new Error(`Couldn't log in: ${JSON.stringify(data)}`)
    }
    console.log(`Succesfully logged in as ${data.name}`)

    // Register modules
    for(const module of modules) {
        for(const event in module.cytubeEvents) {
            socket.on(event, (data) => {
                commitSideEffect(module.cytubeEvents[event](data, state))
            })
        }
    }
})

socket.on('disconnect', (reason) => {
    throw new Error(`Disconnected. ${reason}`)
})