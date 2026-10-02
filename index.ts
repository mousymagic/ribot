import { config, type Config } from './config'
import { io } from 'socket.io-client'

import { parseDocument, ElementType } from 'htmlparser2'
import { type ChildNode, Element } from 'domhandler'

// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/client.js
// https://github.com/Xaekai/PonkBot/blob/1f557b4214b25c344fa83964ae90666259eb371a/lib/ponkbot.js

function socketUrl({secure, host, port, channel}: Config) {
    return (
        `${secure ? 'https' : 'http'}://${host}:${port}/` +
        `socketconfig/${channel}.json`
    )
}

type ChatMsgPayload = {
    username: string,
    msg: string,
    time: Date,
    meta: any
}

type EmotePayload = {
    name: string,
    image: string,
    source: string
}

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

function chatMsgToWebhook(
    {username, msg, time, meta}: ChatMsgPayload,
    webhook: string,
    emotes: EmotePayload[]
) {
    return new Request(webhook, {
        method: 'post',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            avatar_url: getAvatar(username),
            content: msgToMarkdown(msg, emotes)
        })
    })
}

console.log(socketUrl(config));

/*
const response = await fetch(socketUrl(config))
const text = await response.json()
*/

const text = {
  servers: [
    {
      url: "https://bigapple.cytu.be:8443",
      secure: true,
    }, {
      url: "http://bigapple.cytu.be:8880",
      secure: false,
    }
  ],
}

const socket = io(text.servers[0]?.url)
socket.on('error', err => {throw new Error(err)})
socket.once('connect', () => {
    console.log("Connecting...")
    socket.emit('joinChannel', { name: config.channel })
    socket.once('needPassword', () => {
        throw new Error('Channel requires password. Not supported yet.')
    })
    socket.once('rank', () => {
        console.log("  Sending credentials...")
        socket.emit('login', {
            name: config.username,
            pw: config.password
        })
    })

    let emotes: EmotePayload[] = []

    socket.on('emoteList', (data: EmotePayload[]) => {
        emotes = data
    })

    socket.once('login', (data) => {
        if(!data.success) {
            throw new Error(`Couldn't log in: ${JSON.stringify(data)}`)
        }
        console.log(`Succesfully logged in as ${data.name}`)

        socket.on('disconnect', (reason) => {
            throw new Error(`Disconnected. ${reason}`)
        })

        socket.on('chatMsg', (data: ChatMsgPayload) => {
            console.log(`[${data.username}]: ${data.msg}`)

            if (config.webhook == undefined)
                return;

            const request = chatMsgToWebhook(data, config.webhook, emotes)
            fetch(request)
        })
    })
})