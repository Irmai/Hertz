//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [REQUIREMENT]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const Discord = require('discord.js');

const mind = require('./app/mind.js');
const music = require('./app/music.js');
const config = require("./config.json");


//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [RESSOURCES]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const client = new Discord.Client();

//const representant List<Musique> by Guild.Id
const queue = new Map();
const botChannel;

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
    if(message.author.bot && message.author.username != 'Hertz'){
        return console.log(`${message.content} from ${message.author.username}`);
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
            music.execute(message ,args[1] ,serverQueue);
            break;
        default:
            console.log("Unknow function");
            break;
    }
});

client.login(config.token);

//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//
//      [MUSIQUE]
//
//------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
