# Setting up

## Bun

First install [Bun](https://bun.com/)

Install dependencies
```bash
bun install
```

## Discord bot
Create a Discord bot that has Message Content intent

## config.toml
In the same folder as `README.md` and `package.json` create a `config.toml` file with the following contents

```toml
[channels.MYCHANNEL]
host = "cytu.be"
port = "443"
secure = true
username = "CYTUBE USERNAME"
password = "CYTUBE PASSWORD"
webhook = "WEBHOOK"
discordChannel = "DISCORDCHANNEL"

[discord]
token = "MY TOKEN"
appId = "MY APP ID"
```
where:
- `MYCHANNEL`: CyTube channel where the bot will join
- `CYTUBE USERNAME`: Username of your bot CyTube account
- `CYTUBE PASSWORD`: Password of your bot CyTube account
- `WEBHOOK`: Webhook where the CyTube chat will send messages to
- `DISCORD CHANNEL`: Discord Channel id from where the bot will forward messages to the CyTube channel. The bot must in the server where the channel is. The webhook can also send messages to this channel
- `MY TOKEN`: The token of your Discord bot
- `MY APP ID`: App id of your Discord bot

## Registering commands
This must only be done once or each time I add a new Discord command. Run `bun run registerCommands`

# Running
`bun run start`