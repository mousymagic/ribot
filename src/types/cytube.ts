/**
 * @file cytube.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Types for CyTube events or data structures
 */

export type ChatMsgPayload = {
    username: string,
    msg: string,
    time: number,
    meta: any
}

export type EmotePayload = {
    name: string,
    image: string,
    source: string
}

export type UserRank = 1 | 2 | 3 | 4 | 5

export type AddUserPayload = {
    name: string,
    rank: UserRank,
    profile: object,
    meta: object
}

export type UserLeavePayload = { name: string }

export type SetUserRankPayload = {
    name: string,
    rank: UserRank
}

export type UserCountPayload = number

export type ChangeMediaPayload = {
    id: string,
    title: string,
    seconds: number,
    duration: string,
    type: 'yt',
    meta: object,
    currentTime: number,
    paused: boolean
}

export type MediaUpdatePayload = {
    currentTime: number,
    paused: boolean
}

export type SetAFKPayload = {
    name: string,
    afk: boolean
}

export type SetLeaderPayload = string

export type SetPlaylistMeta = {
    count: number,
    rowTime: number,
    time: string
}

export type QueueItem = {
    media: {
        id: string,
        title: string,
        seconds: number,
        duration: string,
        type: 'yt',
        meta: object,
    }
    uid: number,
    temp: boolean,
    queueby: string
}

export type PlaylistPayload = QueueItem[]

export type QueuePayload = {
    item: QueueItem,
    after: number | 'prepend'
}

export type MoveVideoPayload = {
    from: number,
    after: number | 'prepend'
}

export type DeletePayload = { uid: number }

export type SetCurrentPayload = number

export type SetTempPayload = {
    uid: number,
    temp: boolean
}