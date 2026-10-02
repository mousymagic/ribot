import { config, type Config } from './config'
import { io } from 'socket.io-client'

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
    socket.once('login', (data) => {
        if(!data.success) {
            throw new Error(`Couldn't log in: ${JSON.stringify(data)}`)
        }
        console.log(`Succesfully logged in as ${data.name}`)

        socket.on('disconnect', (reason) => {
            throw new Error(`Disconnected. ${reason}`)
        })

        function getAvatar(name: string): string {
            return name == 'ribet' ? 'https://files.catbox.moe/tns833.png'
                 : name == 'UntElHuevo' ? 'https://files.catbox.moe/cr6h8v.png'
                 : name == 'IndecentExtortionist' ? 'https://files.catbox.moe/its8mh.png'
                 : 'https://bnarcade.coolpage.biz/resources/garg1.png'
        }

        function handleChatMsg({username, msg, time, meta}: ChatMsgPayload) {
            console.log(`[${username}]: ${msg}`)
            
            if(config.webhook == undefined)
                return;

            fetch(config.webhook, {
                method: 'post',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: username,
                    avatar_url: getAvatar(username),
                    content: msg
                })
            })
        }

        socket.on('chatMsg', handleChatMsg)
    })
})