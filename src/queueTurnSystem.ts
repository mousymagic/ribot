/**
 * @file queueTurnSystem.ts
 * @author lauraestupida
 * @license MIT
 * 
 * A turn system where the queue will be managed accordingly according to whose
 * turn it is.
 * 
 * Turn is determined based on which order users add videos. First user to add
 * a video will receive the first turn, second user will receive second turn,
 * and so on.
 */

import { type Module, type Effect, Nothing } from './types/effects.ts'
import type { State } from './types/state.ts'
import type {
    ChatMsgPayload, QueuePayload, SetCurrentPayload
} from './types/cytube.ts'

function chat(msg: string): Effect {
    return {
        kind: 'chatCytube',
        msg: msg
    }
}

function getVideo(state: State, id: number) {
    return state.playlist.findIndex(({ uid }) => uid == id)
}

function onChatMsg({ msg, username }: ChatMsgPayload, state: State): Effect {
    if(msg != '!turnSystem' || state.permissions == undefined)
        return Nothing

    if (state.permissions.leaderctl > state.rank)
        return chat('I need to be able to change le leader. Give me sperms!!')

    const enable = !state.turnSystemEnabled

    if (state.playlist.length == 0) {
        return {
            kind: 'many',
            effects: [
                { kind: 'turnSystem', enable: enable },
                chat(enable ? 'Turn system enabled' : 'Turn system disabled')
            ]
        }
    }

    // Determine some turns based on what's already on the queue
    let turns: string[] = []
    const index = getVideo(state, state.currentItem)
    for(let i = index; i < state.playlist.length; i++) {
        const queueby = state.playlist[i]?.queueby
        if(queueby != undefined && !turns.includes(queueby)) {
            turns.push(queueby)
        }
    }

    return {
        kind: 'many',
        effects: [
            { kind: 'turnSystem', enable: enable },
            { kind: 'setTurns', turns: turns, currentTurn: 1 },
            chat(`Order of turns: ${turns.join(', ')}`)
        ]
    }
}

function numToOrdinal(n: number): string {
    return n == 1 ? `${n}st` : n == 2 ? `${n}nd` : n == 3 ? `${n}rd` : `${n}th`
}

function onQueue({ item: {queueby, uid} }: QueuePayload, state: State): Effect {
    if(!state.turnSystemEnabled)
        return Nothing

    if(state.turns.includes(queueby)) {
        const index = getVideo(state, state.currentItem)
        const curqueueby = state.playlist[index]?.queueby
        const turn = state.turns[state.currentTurn]
        
        if(
            curqueueby == undefined || turn == undefined ||
            turn != queueby || curqueueby == queueby || !state.waitingForTurn
        ) { return Nothing }

        return {
            kind: 'many',
            effects: [
                { kind: 'setTurns', waitingForTurn: false},
                { kind: 'pause', pause: false },
                { kind: 'setTemp', uid: state.currentItem, temp: false },
                { kind: 'jumpTo', uid: uid }
            ]
        }
    }

    const newTurns = [...state.turns, queueby]

    return {
        kind: 'many',
        effects: [
            {
                kind: 'setTurns',
                turns: newTurns,
                currentTurn: state.currentTurn,
                waitingForTurn: false,
            },
            chat(`${queueby} has ${numToOrdinal(newTurns.length)} turn`)
        ]
    }
}

function onSetCurrent(id: SetCurrentPayload, state: State): Effect {
    if(!state.turnSystemEnabled)
        return Nothing

    const index = getVideo(state, id)
    const item = state.playlist[index]
    
    const turn = state.currentTurn < state.turns.length ? state.currentTurn : 0
    const name = state.turns[turn]

    if(item == undefined || name == undefined)
        throw new Error('What the heck?')

    if(item.queueby == name) {
        return {
            kind: 'many',
            effects: [
                { kind: 'pause', pause: false },
                { kind: 'setTemp', uid: id, temp: true },
                {
                    kind: 'setTurns',
                    turns: state.turns,
                    currentTurn: turn + 1,
                    waitingForTurn: false
                }
            ]
        }
    }

    const nextIndex = state.playlist.findIndex(({ queueby }) => queueby == name)
    const nextItem = nextIndex != -1 ? state.playlist[nextIndex] : undefined

    if(nextItem != undefined) {
        return {
            kind: 'many',
            effects: [
                { kind: 'pause', pause: false },
                { kind: 'setTemp', uid: id, temp: false },
                { kind: 'jumpTo', uid: nextItem.uid },
            ]
        }
    }

    return {
        kind: 'many',
        effects: [
            { kind: 'setTurns', waitingForTurn: true },
            { kind: 'pause', pause: true },
            { kind: 'setTemp', uid: id, temp: false },
            chat(`Waiting for ${name}...`)
        ]
    }
}

export const module: Module = {
    events: {},
    cytubeEvents: {
        chatMsg: onChatMsg,
        queue: onQueue,
        setCurrent: onSetCurrent,
    }
}