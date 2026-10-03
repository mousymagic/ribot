/**
 * @file index.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Entry point of the bot. All initialization and side effects are done here
 */

import type { State } from './types/state'
import type { Effect, Module } from './types/effects'
import type {
    EmotePayload, PlaylistPayload, QueuePayload, DeletePayload, UserRank,
    SetTempPayload, MoveVideoPayload, SetCurrentPayload, Permissions,
    SetUserRankPayload
} from './types/cytube'

import { EventEmitter } from 'node:events'

import { Client, Events, GatewayIntentBits } from 'discord.js'

import * as conf from '../config.toml'
import { io } from 'socket.io-client'

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

let state: State = {
    events: new EventEmitter(),

    host: conf.cytube.host,
    port: conf.cytube.port, secure: conf.cytube.secure,
    username: conf.cytube.username,
    password: conf.cytube.password,
    channel: conf.cytube.channel,
    channelPassword: undefined,

    socket: socket,
    emotes: [],
    playlist: [],
    currentItem: 0,
    rank: -1,
    permissions: undefined,
    leader: '',

    webhook: conf.discord.webhook,
    token: conf.discord.token
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

/*
* Initialize Discord bot
*/

const client = new Client({intents: [GatewayIntentBits.Guilds]})

client.once(Events.ClientReady, (readyClient) => {
    console.log('Discord bot logged in as ' + readyClient.user.tag)
})

client.login(state.token)

/*
* Initialize CyTube
*/

// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/client.js
// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/ponkbot.js

function socketUrl({secure, host, port, channel}: State) {
    return (
        `${secure ? 'https' : 'http'}://${host}:${port}/` +
        `socketconfig/${channel}.json`
    )
}

socket.on('error', err => {throw new Error(err)})

socket.once('connect', () => {
    console.log("Connecting...")
    socket.emit('joinChannel', { name: state.channel })
    socket.once('needPassword', () => {
        throw new Error('Channel requires password. Not supported yet.')
    })
    socket.once('rank', (rank: UserRank) => {
        console.log("  Sending credentials...")
        state.rank = rank
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
        for(const event in module.events) {
            state.events.on(event, (...args) => {
                commitSideEffect(module.events[event](state, ...args))
            })
        }
    }
})

socket.on('setPermissions', (perms: Permissions) => {
    state.permissions = perms
})

socket.on('setUserRank', ({ name, rank }: SetUserRankPayload) => {
    if(name == state.username)
        state.rank = rank
})

socket.on('setLeader', (leader: string) => {
    state.leader = leader
})

socket.on('disconnect', (reason) => {
    throw new Error(`Disconnected. ${reason}`)
})

// Playlist management

function getVideo(state: State, id: number) {
    return state.playlist.findIndex(({ uid }) => uid == id)
}

socket.on('playlist', (data: PlaylistPayload) => {
    state.playlist = data
    state.events.emit('playlistUpdate')
    console.log('Playlist: ' + state.playlist.map(data => data.media.title))
})

socket.on('queue', ({ item, after }: QueuePayload) => {
    if(state.playlist.length == 0 || after == 'prepend') {
        state.playlist.splice(0, 0, item)
    } else {
        const index = getVideo(state, after)

        if(index == -1) {
            console.log('Received bogus queue payload!')
            return
        }

        state.playlist.splice(index, 0, item)
    }

    state.events.emit('playlistUpdate', item.uid)

    console.log('Playlist: ' + state.playlist.map(data => data.media.title))
})

socket.on('delete', ({ uid }: DeletePayload) => {
    const index = getVideo(state, uid)

    if (index == -1) {
        console.log('Received bogus delete payload!')
        return
    }
    
    const el = state.playlist.splice(index, 1).pop()

    state.events.emit('playlistUpdate', undefined, el)

    console.log('Playlist: ' + state.playlist.map(data => data.media.title))
})

socket.on('moveVideo', ({ from, after }: MoveVideoPayload) => {
    const index = getVideo(state, from)
    const item = index != -1 ? state.playlist[index] : undefined
    const newIndex = after != 'prepend' ? getVideo(state, after) : undefined

    if (item == undefined || newIndex == -1) {
        console.log('Received bogus moveVideo payload!')
        return
    }

    state.playlist.splice(index, 1)
    state.playlist.splice(newIndex != undefined ? newIndex + 1 : 0, 0, item)

    state.events.emit('playlistUpdate', undefined, undefined, from)

    console.log('Playlist: ' + state.playlist.map(data => data.media.title))
})

socket.on('setCurrent', (uid: SetCurrentPayload) => {
    state.currentItem = uid
})

socket.on('setTemp', ({ uid, temp }: SetTempPayload) => {
    const index = getVideo(state, uid)

    if (index == -1 || state.playlist[index] == undefined) {
        console.log('Received bogus setTemp payload!')
        return
    }
    
    state.playlist[index].temp = temp
})