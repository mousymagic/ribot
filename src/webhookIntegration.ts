/**
 * @file webhookIntegration.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Module that sends chat messages and other events to a Discord webhook
 */

import { type Module, type Effect, Nothing } from './types/effects.ts'
import type { State } from './types/state.ts'
import type {
    ChatMsgPayload, AddUserPayload, EmotePayload,
    UserLeavePayload, SetCurrentPayload
} from './types/cytube.ts'

import { parseDocument, ElementType } from 'htmlparser2'
import { type ChildNode, Element } from 'domhandler'

function getAvatar(name: string): string {
    return name == 'ribet' ? 'https://files.catbox.moe/tns833.png'
         : name == 'UntElHuevo' ? 'https://files.catbox.moe/cr6h8v.png'
         : name == 'IndecentExtortionist' ? 'https://files.catbox.moe/its8mh.png'
         : 'https://bnarcade.coolpage.biz/resources/garg1.png'
}

function msgToMarkdown(msg: string, emotes: EmotePayload[]): string {
    function parseList(list: ChildNode[]): string {
        return list.map(parseNode).join('')
    }

    function parseElement(el: Element) {
        const body = parseList(el.children)
        const attr = el.attribs
        const name = el.name

        return name == 'span' && attr.class == 'spoiler' ? `||${body}||`
             : name == 'a' && attr.href == body ? body
             : name == 'a' ? `[${body}](${attr.href})`
             : name == 'code' ? `\`${body}\``
             : name == 'strong' ? `**${body}**`
             : name == 's' ? `~~${body}~~`
             : name == 'em' ? `*${body}*`
             : ''
    }

    function parseText(data: string) {
        let text = data.replaceAll(/([#<>@\[\]\(\)-*_~`|:/\\.])/g, '\\$1');

        for (const emote of emotes) {
            // https://github.com/calzoneman/sync/blob/3.0/src/channel/emotes.js
            const reg = new RegExp(emote.source, 'gi')
            text = text.replaceAll(reg, `[${emote.name}](${emote.image})`)
        }

        return text
    }

    function parseNode(el: ChildNode) {
        return el.type == ElementType.Tag ? parseElement(el)
             : el.type == ElementType.Text ? parseText(el.data)
             : ''
    }

    const dom = parseDocument(msg)

    return parseList(dom.children)
}

function webhookRequest(body: object, url?: string): Effect {
    return url == undefined ? Nothing : {
        kind: 'httpRequest',
        request: new Request(url, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
    }
}

function onChatMsg(
    { username, msg }: ChatMsgPayload,
    { webhook, emotes }: State
) {
    return webhookRequest({
        username: username,
        avatar_url: getAvatar(username),
        content: msgToMarkdown(msg, emotes)
    }, webhook)
}

function onAddUser({ name }: AddUserPayload, { webhook }: State) {
    return webhookRequest({
        embeds: [{
            footer: {
                text: `${name} joined the room`,
                icon_url: getAvatar(name)
            }
        }]
    }, webhook)
}

function onUserLeave({ name }: UserLeavePayload, { webhook }: State) {
    return webhookRequest({
        embeds: [{
            footer: {
                text: `${name} left the room`,
                icon_url: getAvatar(name)
            }
        }]
    }, webhook)
}

function getVideo(state: State, id: number) {
    return state.playlist.findIndex(({ uid }) => uid == id)
}

function onSetCurrent(data: SetCurrentPayload, state: State): Effect {
    const index = getVideo(state, data)
    const item = index != -1 ? state.playlist[index] : undefined

    if(item == undefined)
        return Nothing

    return webhookRequest({
        content: `Now playing \
[${item.media.title}](https://www.youtube.com/watch?v=${item.media.id})
-# Added by ${item.queueby}`
        
    }, state.webhook)
}

export const module: Module = {
    events: {},
    cytubeEvents: {
        chatMsg: onChatMsg,
        addUser: onAddUser,
        userLeave: onUserLeave,
        setCurrent: onSetCurrent
    }
}