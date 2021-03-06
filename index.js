//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [REQUIREMENT]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const Discord = require('discord.js');
const ytdl = require("ytdl-core");


const config = require("./config.json");
const emotes = require("./resources/emotes.json");
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
    if(message.author.bot){
        return console.log("a bot is talking");
    }
    if(!message.author.bot){
        console.log(`${message.content} from ${message.author.username}/n`);
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
            const checkingRoles = checkPermission(message);
            if(checkingRoles == 1)
            {
                console.log("Hello function required");
                message.send("Hello :D");
            } else {
                console.log("------------------------------------------------------------------------------------");
                console.log("warning : role not found");
                console.log("------------------------------------------------------------------------------------");
            }
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
        case '&emotehelp':
            console.log("au secours");
            message.send("En cours de construction, trop d'??motes... Al");
            break;
            //emoteList(message);
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
        return message.channel.send("T'es pas connect??.. Ouh!");
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
            return message.channel.send("J'ai rencontr?? une petite erreur..Ouh...");
        }
    } else {
        serverQueue.songs.push(song);
        console.log("[INF] song added to server queue");
        console.log("-------------------------------------");
        console.log(`${serverQueue.songs[0].title}`);
        return message.channel.send(`${song.title} a ??t?? ajout?? ?? la liste !..Ouh`);
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
    serverQueue.textChannel.send(`D??marrage de la musique!..Ouh *-*${song.title}*-*`);
}

//-------------------------------------------------|
//        [skip for musique ]                      |
//Checks if user is in voice channel               |
//skip the actual song by ending the dispatcher    |
//-------------------------------------------------|

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

//-------------------------------------------------|
//        [stop for musique ]                      |
//Checks if user is in voice channel               |
//stop the actual song by ending the dispatcher    |
//and cleaning the serverQueue.songs               |  
//-------------------------------------------------|

function stop(message, serverQueue) {
    if(!message.member.voice.channel) {
        console.log("[ERR] voiceChannel not found");
        return message.channel.send("T'es pas en vocal!..Ouh..");
    }
    if(!serverQueue) {
        console.log("[ERR] serverQueue not found");
        return message.channel.send("Y'a pas de son!..Ouh!");
    }
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [EMOTES]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//-------------------------------------------------|
//        [init for emotes  ]                      |
//Checks Permissions                               |
//Summon Bot                                       |
//Check if the queu for the guild id exist         | 
//if not create the queue                          |
//push the emotes to the start of the  queue       |
//and call play function                           |
//-------------------------------------------------|

async function emote(message, serverQueue){
    args = message.content.split(" ");
    console.log("Checking Arguments");
    if(!args[1]){
        console.log("args[1] missing");
        return message.channel.send("Y'a pas de son!..Ouh!");
    }
    console.log(`${args[1]} founded`);
    const voiceChannel = message.member.voice.channel;
    console.log("Checking Voice Channel");
    if(!voiceChannel){
        console.log('[ERR] voiceChannel is missing');
        return message.channel.send("T'es pas connect??.. Ouh!");
    }
    console.log("Voice Channel Detected");

    console.log("Checking for permissions");
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if(!permissions){
        console.log('[ERR] permissions is missing');
        return message.channel.send("Je suis faible...Ouh!");
    }
    console.log("Permissions validated");

    console.log("Recovering the emote");
    const emoteArgument = args[1].split("-");
    const emoteIndex = emoteArgument[0];
    const emoteName = emoteArgument[1];
    const inf = emotes.inf.find( element => element.name == emoteName);
    // console.log(`${inf.name}`);
    // console.log(`${inf.id}`);
    // console.log(`${inf.url[01]}`);
    if(!inf){
        console.log("Unknow category");
        return message.channel.send("Pas la bonne cat??gorie ??a !");
    }
    console.log(`${emoteIndex}`);
    const emoteUrl = inf.url[emoteIndex - 1];
    console.log(`${emoteUrl}`);
    if(!emoteUrl){
        console.log("emote unknowed");
        return message.channel.send("Pas la bonne ??mote ??a !");
    }

    const emoteInfo = await ytdl.getInfo(emoteUrl);
    const emote = {
        title: emoteInfo.videoDetails.title,
        url: emoteInfo.videoDetails.video_url
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
        queueConstruct.songs.push(emote);

        try {
            var connection = await voiceChannel.join();
            queueConstruct.connection = connection;
            play(message.guild, queueConstruct.songs[0]);
        } catch(err) {
            console.log(`[ERR] ${err}`);
            queue.delete(message.guild.id);
            return message.channel.send("J'ai rencontr?? une petite erreur..Ouh...!");
        }
    } else {
        serverQueue.songs.splice(1,0,emote);
        console.log("[INF] emote added to server queue");
        console.log("-------------------------------------");
        serverQueue.songs.map( element => {
            console.log(element);
        })
        console.log("-------------------------------------");
        console.log(`${serverQueue.songs[0].title}`);
        serverQueue.connection.dispatcher.end();
        return message.channel.send(`${emote.title} a ??t?? ajout?? ?? la liste!..Ouh!`);
    }
}

function emoteList(message){
    var answer = "```\n";
    var timer_1 = 1;
    emotes.inf.map(element => {
        const name = element.name;
        const id = {};
        console.log(element.name);
        answer = answer + "\n" + "[" + element.name + "]" + "\n";
        answer = answer + "---------------------------------\n"
        element.id.map(element => {
            if(timer_1 < 4){
                console.log("=> " + parseInt(element) + " " + name);
                answer = answer + " | " + parseInt(element) + name;
                timer_1 = timer_1 +1;
            } else {
                console.log("=> " + parseInt(element) + " " + name);
                answer = answer + " | " + parseInt(element) + name + " | " + "\n";
                timer_1 = 1;
            }
            // console.log("=> " + parseInt(element) + " " + name);
            // answer = answer + "\n" + parseInt(element) + name;
        })
        answer = answer + "\n---------------------------------"
    })
    answer = answer + "```\n";
    console.log(answer);
    return message.channel.send(answer);
}

function checkPermission(message){
    const roles = message.member.roles.cache;
    // roles.map(element => {
    //     if(element.)
    // })
    
    console.log(roles);
    if(roles.has("Hertz Supporter")){
        console.log("Role Found");
        return 1;
    }else {
        console.log("Role not Found");
        return 2;
    }
}