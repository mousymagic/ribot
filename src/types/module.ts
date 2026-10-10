/**
 * @file module.ts
 * @author lauraestupida
 * @license MIT
 * 
 * How each module should behave
 */

import type { Channel } from "./cytube"
import type { Effect } from "./effects"
import type { ChannelEvents, State } from "./state"

export type ChannelHandlers = Partial<{
    [event in keyof ChannelEvents]:
        (data: ChannelEvents[event], channel: Channel, state: State) => Effect
}>

export type Module = {
    channelEvents?: ChannelHandlers
}