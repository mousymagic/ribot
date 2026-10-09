/**
 * @file cytubeProtocol.ts
 * @author lauraestupida
 * @license MIT
 * 
 *  Handles incoming events from a CyTube socket and handles them accordingly to
 * the protocol. This module performs no side effects by its own.
 */

import type { Socket } from "socket.io-client";
import type { SocketState } from "./types/state";
import { bind, end, type Effect, type Kind } from "./types/effects";
import type { CytubeEvents, PlaylistItem } from "./types/cytube";

export function socketState(
    socket: Socket, name: string, username: string, password: string
): SocketState {
    return {
        name,
        leader: null,
        username,
        password,
        rank: -1,
        emotes: [],
        playlist: [],
        users: [],
        drinks: 0,
        
        user(name: string) {
            return this.users.find(user => user.name == name)
        },
        media(uid: number) {
            return this.playlist.find(item => item.uid == uid)
        },

        socket,
        status: 'unconnected',
        started: new Date(),

        newState: next => ['socketstate', { name, next }],
        send: (event, message) => ['socketemit', { name, event, message }],
        emit: (event, data) => ['channelevent', { name, event, data }],

        updateUser(name, next) {
            const index = this.users.findIndex(user => user.name == name)
            const user = index != -1 ? this.users[index] : undefined
            if(user === undefined)
                return null
            const users = this.users.with(index, {...user, ...next})
            return this.newState({users})
        },
    }
}

/**
 * How to handle every event coming from the CyTube socket
 */
export const eventHandler:
    {[event in keyof CytubeEvents]: 
        (payload: CytubeEvents[event], state: SocketState) => Effect<Kind>} =
{
    connect: (_, { status, newState, name, username, password, send }) => bind(
        status != 'unconnected' ? end() : ['log', 'Connecting...'],
        _ => newState({status: 'connected'}),
        _ => send('joinChannel', { name }),
        _ => send('login', { name: username, pw: password })
    ),
    login: ({ success }, { newState, username }) => bind(
        success ? newState({status: 'logged'})
                : end(['error', `Couldn't login as ${username}`]),
        _ => ['log', `Logged in as ${username}`]
    ),
    
    userlist: (users, { newState }) => newState({users}),
    addUser: (user, { newState, users }) => newState({users: [...users, user]}),
    userLeave: ({ name }, { newState, users }) =>
        newState({users: users.filter(user => user.name != name)}),

    playlist: (playlist, { newState }) => newState({playlist}),
    queue: ({ item, after }, { playlist: oldpl, newState }) => {
        const playlist: PlaylistItem[] =
            oldpl.length == 0 ? [item]
            : after == 'prepend' ? [item, ...oldpl]
            : after == 'append' ? [...oldpl, item]
            : oldpl.flatMap(i => i.uid == after ? [i, item] : [i])

        return newState({playlist})
    },
    moveVideo: ({ from, after }, state) => {
        const item = state.media(from)
        if(item === undefined)
            return end(['error', `Item with uid ${from} doesn't exist`])

        const withoutItem = state.playlist.filter(i => i != item)

        const playlist: PlaylistItem[] =
            after == 'prepend' ? [item, ...withoutItem]
            : after == 'append' ? [...withoutItem, item]
            : withoutItem.flatMap(i => i.uid == after ? [i, item] : [i])

        return state.newState({playlist})
    },
    delete: ({ uid }, { playlist, newState }) =>
        newState({playlist: playlist.filter(item => item.uid != uid)}),
    
    chatMsg(msg, state) {
        if(msg.time < state.started.getTime())
            return end()
        
        return state.emit('chatMsg', msg)
    },

    emoteList: (emotes, { newState }) => newState({emotes}),

    drinkCount: (drinks, { newState }) => newState({drinks}),
}