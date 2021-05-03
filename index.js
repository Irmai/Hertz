//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [REQUIREMENT]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const Discord = require('discord.js');
const ytdl = require("ytdl-core");
const config = require("./config.json");


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [RESSOURCES]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const client = new Discord.Client();

//Musique List by Guild Id 
const queue = new Map();
var botChannel;

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [CORE]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    botChannel = client.channels.cache.find(ch => ch.name === 'bot');
    botChannel.send("```Hertz status : [READY]```");
    botChannel.send("```&<commande_name> <args>```");
});

client.on('reconnecting', () => {
    console.log(`[INF] Reconnecting as ${client.user.tag}!`);
});

client.on('disconnect', () => {
    const botChannel = client.channels.cache.find(ch => ch.name === 'bot');
    botChannel.send("```Hertz status : [BYEBYE]]```")
    console.log(`[INF] Disconnected`);
});

client.on('message', async message => {
    console.log("------------------------------------------------------------------------------------")
    console.log("----------------------------MESSAGE RECEIVED----------------------------------------")
    console.log("------------------------------------------------------------------------------------")
    if(!message.author.bot){
        return console.log(`${message.content} from ${message.author.username}/n`);
    }
    console.log(`Message sended by ${message.author.username}`);
    if(!message.content.startsWith(config.prefix)){
        console.log('Content ===============');
        return console.log(`${message.content}`);
    }

    const serverQueue = queue.get(message.guild.id);
    const args = message.content.split(" ");

    switch(args[0]){
        case '&hello':
            console.log("Hello function required");
            mind.hello(message);
            break;
        case '&play':
            console.log("Play function required");
            execute(message ,args[1] ,serverQueue);
            break;
        case '&skip':
            console.log('Skip function required');
            skip(message, serverQueue);
            break; 
        case '&stop':
            console.log('Stop function required');
            stop(message, serverQueue);
            break;
        case '&emote':
            console.log('[INF] [emote] detected');
            emote(message, serverQueue);
            break;
        case '&emote2':
            console.log('[INF] [emote2] detected');
            emote_v2(message, serverQueue);
            break;
        default:
            console.log("[INF] nani ?");
            break;
    }
});

client.login(config.token);

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [MUSIQUE]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//-------------------------------------------------|
//        [Init for musique ]                      |
//Checks Permissions                               |
//Summon Bot                                       |
//Check if the queu for the guild id exist         | 
//if not create the queue                          |
//push the musique to the queue                    |
//and call play function                           |
//-------------------------------------------------|

async function execute(message, song_url, serverQueue){
    const voiceChannel = message.member.voice.channel;
    console.log('[INF] searching for voiceChannel');
    if(!voiceChannel) {
        console.log('[ERR] voiceChannel is missing')
        return message.channel.send("T'es pas connecté.. Ouh!");
    }
    console.log('[INF] voiceChannel detected');
    console.log('[INF] searching for permissions')
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if(!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        console.log('[ERR] permissions is missing');
        return message.channel.send("Je suis faible...Ouh!");
    }
    console.log('[INF] permissions detected');
    
    const songInfo = await ytdl.getInfo(song_url);
    const song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url
    }

    if(!serverQueue) {
        const queueConstruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 1,
            playing: true
        };

        queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch (err) {
            console.log(`[ERR] ${err}`);
            queue.delete(message.guild.id);
            return message.channel.send("J'ai rencontré une petite erreur..Ouh...");
        }
    } else {
        serverQueue.songs.push(song);
        console.log("[INF] song added to server queue");
        console.log("-------------------------------------");
        console.log(`${serverQueue.songs[0].title}`);
        return message.channel.send(`${song.title} a été ajouté à la liste !..Ouh`);
    }

}

//-------------------------------------------------|
//        [play for musique ]                      |
//Checks if songs exist                            |
//use the connection to play the musique           |
//-------------------------------------------------|

function play(guild, song){
    const serverQueue = queue.get(guild.id);
    if(!song){
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return console.log("[ERR] song is missing");
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url, { filter: 'audioonly' }))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.log(error));
    dispatcher.setVolume(serverQueue.volume);
    serverQueue.textChannel.send(`Démarrage de la musique!..Ouh *-*${song.title}*-*`);
}

function skip(message, serverQueue) {
    if(!message.member.voice.channel){
        console.log("[ERR] voiceChannel not found");
        return message.channel.send(
            "T'es pas en vocal!.Ouh.."
        );
    }
    if(!serverQueue) {
        console.log("[ERR] serverQueue not found");
        return message.channel.send(
            "y'a pas de son!..Ouh"
        );
    }
    console.log("[INF] music skipped");
    serverQueue.connection.dispatcher.end();
}

function stop(message, serverQueue) {
    if(!message.member.voice.channel) {
        console.log("[ERR] voiceChannel not found");
        return message.channel.send("T'es pas en vocal!..Ouh..");
    }
    if(!serverQueue) {
        console.log("[ERR] serverQueue not found");
        return message.channel.send("Y'a pas de son!..LOuh!");
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}