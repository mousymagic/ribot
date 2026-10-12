/**
 * @file turnSystem.ts
 * @author lauraestupida
 * @license MIT
 */

import type { Channel } from "../types/cytube";
import { bind, end, type Effect } from "../types/effects";
import type { ChannelHandlers } from "../types/module";

/**
 * Jumps to the video that should correspond to the current user's turn.
 * This code yearns for the state machines
 */
function playMediaOfCurrentTurn(channel: Channel, jumped: Boolean): Effect {
    if(channel.turns == undefined)
        return end()

    const curmedia = channel.currentMedia()
    if(curmedia == undefined)
        return end()

    const prevturn = channel.turns.at(-1)
    const [curturn, ...nextturns] = channel.turns

    if(prevturn == undefined || curturn == undefined)
        return end()
    
    // Video follows previous turn. Nothing to jump to
    if(curmedia.queueby == prevturn.name && !jumped && !channel.isPausingMedia)
        return end()
    
    // Video is the current turn. Rotate turns
    if(curmedia.queueby == curturn.name && jumped) {
        return bind(
            // Rotate turns
            channel.newState({ turns: [...nextturns, curturn] }),
            _ => channel.setTemp(curmedia.uid, true),
            _ => channel.moveMedia(curmedia.uid)
        )
    }

    // Try to jump to current turn's video
    const mediaToJump =
        channel.playlist.find(item => item.queueby == curturn.name)
    
    if(mediaToJump != undefined) {
        return bind(
            channel.pauseMedia(false),
            _ => channel.jumpTo(mediaToJump.uid)
        )
    }

    // No videos on queue that correspond to this turn. Wait.
    return channel.isPausingMedia ? end() : bind(
        channel.pauseMedia(true),
        _ => channel.sendMessage(`Waiting for ${curturn.name}`),
    )
}

export const channelEvents: ChannelHandlers = {
    chatMsg({ msg }, channel, state) {
        if(msg != '/turn')
            return end()

        if(channel.turns != undefined) {
            return bind(
                channel.newState({ turns: undefined }),
                _ => channel.pauseMedia(false),
                _ => channel.sendMessage('Turn system is off')
            )
        }

        if(channel.playlist.length != 0)
            return end(channel.sendMessage('First clean the playlist'))

        return bind(
            channel.newState({ turns: [] }),
            _ => channel.sendMessage('Turn system is on')
        )
    },
    queue({ queueby, uid }, channel, state) {
        if(channel.turns == undefined)
            return end()

        // If this user already has a turn, see if it should play next
        if(channel.turns.some(t => t.name == queueby)) {
            return bind(
                channel.setTemp(uid, false),
                _ => playMediaOfCurrentTurn(channel, false)
            )
        }
        
        // User doesn't have a turn yet, so assign one
        const prevTurns = channel.turns
        
        const turn = {name: queueby, turn: prevTurns.length + 1}
        const turns =
            prevTurns.length == 0 ? [turn]
            : prevTurns.flatMap(t => t.turn == 1 ? [turn, t] : [t])

        return bind(
            channel.newState({ turns }),
            _ => channel.setTemp(uid, false),
            _ => channel.sendMessage(`${queueby} has turn #${turn.turn}`)
        )
    },
    setCurrent: (_, channel) => playMediaOfCurrentTurn(channel, true),

}