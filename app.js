// Require the necessary discord.js classes
const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { token, channel_id, mc_ip, mc_port } = require('./config.json');

// MC PING
const mcping = require('mcping-js');
let protocolVersion = 5;
let timeout = 10000;

const server = new mcping.MinecraftServer(mc_ip, mc_port);
let status = 'offline';
let postedStatus = 'offline';
let online = []; // Previous player list for compare
let uuids = {}; // Remember UUIDs

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const intervalSeconds = 180;

// Ready
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    refresh();
    setInterval(() => {
        refresh();
    }, intervalSeconds*1000);

    /** Ping Minecraft server for up-to-date data */
    function refresh() {
        server.ping(timeout, protocolVersion, (mc_err, mc_res) => {
            // if(mc_err !== undefined) status = 'offline';
            // else status = 'online';
            // if(postedStatus !== status) {
            //     joinLeave('', `Server ${status}`);
            //     postedStatus = status;
            // }

            console.log(mc_res);

            if(mc_res?.players?.sample === undefined) return;

            // Loop online players
            let current = []; // Player list in array form
            for(let p of mc_res?.players?.sample) {
                current.push(p.name);
                uuids[p.name] = p.id;

                // Join
                if(!online.includes(p.name)) {
                    online.push(p.name);
                    joinLeave(p.name, ' joined the game');
                }
            }

            // Compare with old list
            for(let i in online) {
                let item = online[i];

                // Leave
                if(!current.includes(item)) {
                    online.splice(i, 1);
                    joinLeave(item, ' left the game');
                }
            }

            // console.log(online, current);

            /** Send join/leave message to Discord */
            function joinLeave(name, message='') {
                let uuid = uuids[name];
                let iconURL = name === '' ? undefined : `https://mc-heads.net/avatar/${uuid}`;
                let color = message === ' joined the game' ? 0x0099FF : 0xb92f3b;
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setAuthor({ name:name+message, iconURL:iconURL});

                // Post to Discord
                client.channels.cache.get(channel_id).send({ embeds: [embed] });

                // Plaintext message
                // client.channels.cache.get(channel_id).send(name+message);

                console.log(name+message);
            }
        })
    }
});

client.login(token); // Log in
