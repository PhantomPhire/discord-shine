# discord-shine

## About
discord-shine is a TypeScript utility module wrapping both the discord.js and discord.js-commando modules. It was built as an anchor point to standardize certain aspects of the way I personally make my Discord bots to minimize code reuse between the projects. It comes equipped with various utilities that, while not necessarily centered on a specific theme, are simply utilities that I have constructed specifically to meet the needs of my Discord bots.

As of now, the framework is limited to what I have specifically needed, but can certainly be expanded.

## Features
discord-shine features the following amenities:

- A robust sound framework wrapping the discord.js sound framework allowing for voice channel management and queued playback that scales between guilds
- A bot manager class establishing singleton access to the bot client
- A login manager keeping the bot online in the case of connection issues
- A name resolution system allowing for the resolving of user-input strings to specific objects in the context of guild; this uses the Levenshtein distance alogrithm to find the closest match among a group of objects

## Installation
For basic installation, use:

```
npm install discord-shine ==save
```

Note: Because this library depends heavily on the [discord.js](https://www.npmjs.com/package/discord.js) and [discord.js-commando](https://www.npmjs.com/package/discord.js-commando) frameworks, please refer to their documentation for optional installations, most notably the voice support.

## Example Usage
For simply the login manager, import the login manager and instantiate it the CommandoClient and bot token; the manager itself will work autonomously.

```javascript
// Assuming bot is your CommandoClient and token is your bot's token
let loginManager = new LoginManager(bot, token);
```

For a full-fledged encapsulation of the bot as a manager, including initializing the singleton access, make a class inheriting from BotManager:

```javascript
class MyBotManager extends BotManager {
    constructor(prefix, owner) {
        super(new CommandoClient({ commandPrefix: prefix, owner: owner }));
    }

    run(token) {
        super.run(token);
    }
}
```

To configure the sound file system, use the following:

```javascript
// Assuming soundPath is the path to a folder containing the sound files you want your bot to have access to
SoundFileManager.initialize(soundPath);
```

To make use of the GuildAudioPlayer framework, retrieve the guild's specific player using its id and operate from there:

```javascript
// Assuming guild is a Guild object representing the guild you want to play in and voiceChannel is a VoiceChannel object of the voice channel you want to join
let player = GuildAudioPlayer.getGuildAudioPlayer(guild.id);
player.join(voiceChannel);

let sound = SoundFileManager.getFileSound("quack.wav");
player.add(sound);
player.play();

// Alternatively, the joinAndPlay flag can be set on the player to allow for quick joining, playing, and leaving
player.joinAndPlay = true;
player.add(sound);
```

The name resolution utility offers a powerful way to resolve strings to Discord objects:

```javascript
// Gets a voice channel based on the name of the voice channel from a specific guild
let voiceChannel = stringToVoiceChannel("myVoiceChannel", guild);
```

## Help
If you have any questions or comments, feel free to contact me on Discord at SweetWilly013#2452.

## Links
* [GitHub](https://github.com/PhantomPhire/discord-shine)
* [NPM](https://www.npmjs.com/package/discord-shine)
* [discord.js](https://www.npmjs.com/package/discord.js)
* [discord.js-commando](https://www.npmjs.com/package/discord.js-commando)
* [discord.js documentation](https://discord.js.org/#/)
