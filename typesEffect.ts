/**
 * @file typesEffects.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Provides a type for how modules should behave and an Effects type.
 * 
 * The effects type describes all the side effects a module or function wants to
 * make without actually doing them so that the responsibility is of the caller.
 */

import * as cytube from './cytubeTypes'
import { type State } from "./typeState"

/**
 * Does nothing
 */
export type NothingEffect = { kind: 'nothing' }
export const Nothing: NothingEffect = { kind: 'nothing' }

/**
 * Carries out an HTTP Request
*/
export type HTTPEffect = {
    kind: 'httpRequest',
    request: Request
}

export type Effect = NothingEffect | HTTPEffect

export type CytubeEventHandler<T> = (data: T, state: State) => Effect

/**
 * Describes a modular functionality of the bot. Most of the typings effort are
 * to make sure modules don't do any side effects of their own.
 */
export type Module = {
    /**
     * Listens for events coming from the Cytube socket
     */
    cytubeEvents: {
        chatMsg?: CytubeEventHandler<cytube.ChatMsgPayload>,
        addUser?: CytubeEventHandler<cytube.AddUserPayload>,
        userLeave?: CytubeEventHandler<cytube.UserLeavePayload>,
        changeMedia?: CytubeEventHandler<cytube.ChangeMediaPayload>
    }
}