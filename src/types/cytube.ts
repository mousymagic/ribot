/**
 * @file cytube.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Useful types for dealing with CyTube events
 */

export const Permissions = [
    'seeplaylist', 'playlistadd', 'playlistnext', 'playlistmove',
    'playlistdelete', 'playlistjump', 'playlistaddlist', 'oplaylistadd',
    'oplaylistnext', 'oplaylistmove', 'oplaylistdelete', 'oplaylistjump',
    'oplaylistaddlist', 'playlistaddcustom', 'playlistaddrawfile',
    'playlistaddlive', 'exceedmaxlength', 'addnontemp', 'settemp',
    'playlistshuffle', 'playlistclear', 'pollctl', 'pollvote', 'viewhiddenpoll',
    'voteskip', 'viewvoteskip', 'mute', 'kick', 'ban', 'motdedit', 'filteredit',
    'filterimport', 'emoteedit', 'emoteimport', 'playlistlock', 'leaderctl',
    'drink', 'chat', 'chatclear', 'exceedmaxitems', 'deletefromchannellib',
    'exceedmaxdurationperuser',
] as const

export type Permission = typeof Permissions[number]

export type User = Readonly<{
    name: string;
    rank: number;
    profile: Readonly<{ image: string, text: string }>;
    meta: Readonly<{
        afk: boolean,
        muted: boolean,
        smuted?: boolean,
        aliases?: string[],
        ip?: string
    }>
}>

export type Emote = Readonly<{
    name: string;
    image: string;
    source: string;
}>

export type Channel = Readonly<{
    name: string;
    /**
     * Username of the account that is logged into this channel
     */
    username: string;
    /**
     * Password of the account that is logged into this channel
     */
    password: string;
    leader: string | null;
    rank: number;
    emotes: Emote[];
    users: User[];
    drinks: number,

    user(name: string): User | undefined,
}>

type MessageClass = 'server-whisper' | 'shout' | 'drink' | 'action' | 'spoiler'

export type MessagePayload = Readonly<{
    username: string,
    msg: string,
    time: number,
    meta: {
        addClass?: MessageClass,
        addClassToNameAndTimestamp?: boolean,
        forceShowName?: true,
        action?: boolean
    }
}>

/**
 * Every event that the CyTube socket sends alongside its data type
 */
export type CytubeEvents = {
    connect: null,
    login: { success: boolean, name: string },
    emoteList: Emote[],
    userlist: User[],
    addUser: User,
    userLeave: Pick<User, 'name'>,
    setUserRank: Pick<User, 'name' | 'rank'>,
    drinkCount: number,
    setUserMeta: Pick<User, 'name' | 'meta'>,
    setAFK: { name: string, afk: boolean }
    chatMsg: MessagePayload,
}

/**
 * Every event we can send to CyTube alongside its data type
 */
export type CytubeOutgoing = {
    joinChannel: { name: string },
    login: { name: string, pw: string },
    chatMsg: Pick<MessagePayload, 'msg' | 'meta'>
}