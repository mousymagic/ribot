/**
 * @file effects.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Provides a type for how modules should behave and an Effects type.
 * 
 * The effects type describes all the side effects a module or function wants to
 * make without actually doing them so that the responsibility is of the caller.
 */

import * as cytube from './cytube'
import { type State } from "./state"

export type CytubeEventHandler<T> = (data: T, state: State) => Effect

/**
 * Describes a modular functionality of the bot. Most of the typings effort are
 * to make sure modules don't do any side effects of their own.
 */
export type Module = {
    /**
     * Listens for events coming from the bot
     */
    events: {
        /**
         * Whenever the playlist is updated.
         * @param add - uid of the item that got added
         * @param remove - item that got removed
         * @param move - item that got moved
         */
        playlistUpdate?:
            (state: State, add?: number,
             remove?: cytube.QueueItem, move?: number) => Effect
    }

    /**
     * Listens for events coming from the Cytube socket
     */
    cytubeEvents: {
        chatMsg?: CytubeEventHandler<cytube.ChatMsgPayload>,
        addUser?: CytubeEventHandler<cytube.AddUserPayload>,
        userLeave?: CytubeEventHandler<cytube.UserLeavePayload>,
        changeMedia?: CytubeEventHandler<cytube.ChangeMediaPayload>,
        queue?: CytubeEventHandler<cytube.QueuePayload>,
        setCurrent?: CytubeEventHandler<cytube.SetCurrentPayload>,
        setLeader?: CytubeEventHandler<string>,
        setPlaylistLocked?: CytubeEventHandler<boolean>
    }
}

/**
 * Does nothing
 */
export type NothingEffect = { kind: 'nothing' }
export const Nothing: NothingEffect = { kind: 'nothing' }

/**
 * Does many side effects
 */
export type ManyEffect = {
    kind: 'many',
    effects: Effect[]
}

/**
 * Carries out an HTTP Request
*/
export type HTTPEffect = {
    kind: 'httpRequest',
    request: Request,
    handle?: (text: string, state: State) => Effect
}

/**
 * Chats in CyTube
 */
export type ChatCytubeEffect = {
    kind: 'chatCytube',
    msg: string,
    meta?: object
}

/**
 * Moves an item on playlist CyTube
 * 
 * If after is left out then it moves it to the beginning of the playlist
 */
export type MoveMediaEffect = {
    kind: 'moveMedia',
    from: number,
    after?: number
}

/**
 * Forces bot to be leader to pause the video as long as pause is true
 */
export type PauseEffect = {
    kind: 'pause',
    pause: boolean
}

/**
 * Sets an item on the playlist as temporary
 */
export type SetTempEffect = {
    kind: 'setTemp',
    uid: number,
    temp: boolean
}

/**
 * Sets current playing video to uid
 */
export type JumpToItemEffect = {
    kind: 'jumpTo',
    uid: number
}

/**
 * Enables or disables the turn system
 */
export type TurnSystemEffect = {
    kind: 'turnSystem',
    enable: boolean
}

/**
 * Sets the turn
 */
export type SetTurns = {
    kind: 'setTurns',
    turns?: string[],
    currentTurn?: number,
    waitingForTurn?: boolean
}

/**
 * Adds a YouTube video to the queue
 */
export type AddYtVideo = {
    kind: 'addYt',
    id: string,
    pos?: 'mext' | 'end',
    temp?: boolean
}

export type Effect =
    NothingEffect | HTTPEffect | ManyEffect | ChatCytubeEffect |
    MoveMediaEffect | PauseEffect | SetTempEffect | JumpToItemEffect |
    TurnSystemEffect | SetTurns | AddYtVideo