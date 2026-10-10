/**
 * @file discordBridge.ts
 * @author lauraestupida
 * @license MIT
 * 
 * Sends CyTube messages to Discord and viceversa
 */

import { end, type Effect } from "../types/effects";
import type { ChannelHandlers } from "../types/module";

import { parseDocument, ElementType } from 'htmlparser2'
import { type ChildNode, Element } from 'domhandler'
import { getMediaUrl, type Emote } from "../types/cytube";

function msgToMarkdown(msg: string, emotes: Emote[]): string {
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

type WebhookBody = Partial<{
    username: string,
    avatar_url: string,
    content: string,
    embeds: Array<Partial<{
        footer: Partial<{
            text: string,
            icon_url: string
        }>
    }>>
}>

function postToWebhook(url: string, body: WebhookBody): Effect<'http'> {
    return ['http', new Request(url, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })]
}

export const channelEvents: ChannelHandlers = {
    userJoined({ name, profile: { image } }, { webhook, username }) {
        if(name == username)
            return end()

        return postToWebhook(webhook, {
            embeds: [{
                footer: {
                    icon_url: image,
                    text: `${name} joined the room`
                }
            }]
        })
    },
    userLeft({ name, profile: { image } }, { webhook }) {
        return postToWebhook(webhook, {
            embeds: [{
                footer: {
                    icon_url: image,
                    text: `${name} left the room`
                }
            }]
        })
    },
    chatMsg({ msg, username, meta }, channel) {
        if(username == '[server]')
            return end()

        const user = channel.user(username)
        if(user == undefined)
            return end()

        const drinkCount: WebhookBody =
            meta.addClass === 'drink'
            ? {embeds: [{footer: {text: `${channel.drinks} drinks!`}}]}
            : {}

        return postToWebhook(channel.webhook, {
            username,
            content: msgToMarkdown(msg, channel.emotes),
            avatar_url: user.profile.image,
            ...drinkCount
        })
    },
    setCurrent(item, { webhook }) {
        const content =
            `Now playing... [${item.media.title}](${getMediaUrl(item)})\n`
            + `-# Added by ${item.queueby}`
        console.log(`SENDING ${content}`)
        return postToWebhook(webhook, {content})
    },
}