import {Guild, GuildMember, VoiceChannel} from "discord.js";
import {CommandoMessage} from "discord.js-commando";

/**
 * Indicates the percentage threshold that two strings must be within one another to pass the Levenshtein test.
 * @constant
 */
const levenshteinThreshold = 0.3;

/**
 * Contains helper functions for resolving an input string into discord objects
 */
export abstract class NameResolution {
    /**
     * Resolves user input to a GuildMember object. Applicable only internally to guilds
     * @param input The string user input
     * @param guild The guild from which the input originated
     */
    public static stringToGuildMember(input: string, guild: Guild | undefined | null): GuildMember | undefined {
        if (input == null || guild == null) {
            return undefined;
        }

        // Make input lowercase for ease of user input
        let inputLower = input.toLowerCase();

        // First, try parsing it as an user ID
        if (guild.members.has(input)) {
            return guild.members.get(inputLower);
        }

        // If not, let's look at the guild's members to try and find a match
        let guildMembers = guild.members.array();
        let guildMemberUsernames: Array<string> = new Array<string>();
        let guildMemberDisplaynames: Array<string> = new Array<string>();
        for (let i = 0; i < guildMembers.length; i++) {
            guildMemberUsernames.push(guildMembers[i].user.username.toLowerCase());
            guildMemberDisplaynames.push(guildMembers[i].displayName.toLowerCase());
        }

        let result = NameResolution.bestMatch(inputLower, guildMemberUsernames);
        if (result !== undefined) {
            for (let i = 0; i < guildMembers.length; i++) {
                if (guildMembers[i].user.username.toLowerCase() === result)
                    return guildMembers[i];
            }
        }

        // This is done in two different iterations so that users cannot abuse nicknames to obfuscate the results
        // of these commands
        result = NameResolution.bestMatch(inputLower, guildMemberDisplaynames);
        if (result !== undefined) {
            for (let i = 0; i < guildMembers.length; i++) {
                if (guildMembers[i].displayName.toLowerCase() === result)
                    return guildMembers[i];
            }
        }

        return undefined;
    }

    /**
     * Resolves user input to a GuildMember object. Applicable only internally to guilds
     * @param input The string user input
     * @param guild The guild from which the input originated
     */
    public static stringArrayToGuildMember(input: Array<string>, guild: Guild | undefined | null): GuildMember | undefined {
        if (input == null || guild == null) {
            return undefined;
        }

        // Sanitize input
        let inputLower = NameResolution.stringArrayToLower(input);

        // First, try parsing it as an user ID
        for (let i = 0; i < inputLower.length; i++) {
            if (guild.members.has(inputLower[i])) {
                return guild.members.get(inputLower[i]);
            }
        }

        // If not, let's look at the guild's members to try and find a match
        let guildMembers = guild.members.array();
        let guildMemberUsernames: Array<string> = new Array<string>();
        let guildMemberDisplaynames: Array<string> = new Array<string>();
        for (let i = 0; i < guildMembers.length; i++) {
            guildMemberUsernames.push(guildMembers[i].user.username.toLowerCase());
            guildMemberDisplaynames.push(guildMembers[i].displayName.toLowerCase());
        }

        let result = NameResolution.bestMatchOfArray(inputLower, guildMemberUsernames);
        if (result !== undefined) {
            for (let i = 0; i < guildMembers.length; i++) {
                if (guildMembers[i].user.username.toLowerCase() === result)
                    return guildMembers[i];
            }
        }

        // This is done in two different iterations so that users cannot abuse nicknames to obfuscate the results
        // of these commands
        result = NameResolution.bestMatchOfArray(inputLower, guildMemberDisplaynames);
        if (result !== undefined) {
            for (let i = 0; i < guildMembers.length; i++) {
                if (guildMembers[i].displayName.toLowerCase() === result)
                    return guildMembers[i];
            }
        }

        return undefined;
    }

    /**
     * Extracts a voice channel from a command mesage
     * @param input The string user input
     * @param guild The guild from which the input originated
     * @param message The commando message to utilize for context
     */
    public static commandMessageToVoiceChannel(args: Array<string> | undefined, message: CommandoMessage, guild: Guild | undefined): VoiceChannel | undefined {
        let result: VoiceChannel | undefined = undefined;

        // Test mentions first
        if (message.mentions.members.size >= 0) {
            let member = message.mentions.members.find( (member: GuildMember) => member.voice.channel != undefined);

            if (member != undefined) {
                result = member.voice.channel;
            }
        }
        // See if string resolves to a guild member
        if (result == undefined && args != undefined) {
            let guildMember = NameResolution.stringArrayToGuildMember(args, guild);

            if (guildMember != undefined) {
                result = guildMember.voice.channel;
            }
        }

        // Next, test input for voice channels
        if (result == undefined && args != undefined) {
            result = NameResolution.stringArrayToVoiceChannel(args, message.guild);
        }

        // Last, if all else fails, see if poster is in voice channel
        if (result == undefined) {
            result = message.member.voice.channel;
        }

        return result;
    }

    /**
     * Resolves user input to a VoiceChannel object. Applicable only internally to guilds
     * @param input The string user input
     * @param guild The guild from which the input originated
     */
    public static stringToVoiceChannel(input: string, guild: Guild | undefined | null): VoiceChannel | undefined {
        if (input == null || guild == null) {
            return undefined;
        }

        // Make input lowercase for ease of user input
        let inputLower = input.toLowerCase();

        let channels = guild.channels.array();
        let channelNames: Array<string> = new Array<string>();

        for (let i = 0; i < channels.length; i++) {
            if (channels[i].type === "voice")
                channelNames.push(channels[i].name.toLowerCase());
        }

        let result = NameResolution.bestMatch(input.toLowerCase(), channelNames);
        if (result != undefined) {
            // This is kinda lazy
            for (let i = 0; i < channels.length; i++) {
                if (channels[i].name.toLowerCase() === result) {
                    return channels[i] as VoiceChannel;
                }
            }
            return guild.channels.get(result) as VoiceChannel;
        }

        return undefined;
    }

    /**
     * Resolves user input to a VoiceChannel object. Applicable only internally to guilds
     * @param input The string user input
     * @param guild The guild from which the input originated
     */
    public static stringArrayToVoiceChannel(input: Array<string>, guild: Guild | undefined | null): VoiceChannel | undefined {
        if (input == null || guild == null) {
            return undefined;
        }

        // Make input lowercase for ease of user input
        let inputLower = NameResolution.stringArrayToLower(input);

        let channels = guild.channels.array();
        let channelNames: Array<string> = new Array<string>();

        for (let i = 0; i < channels.length; i++) {
            if (channels[i].type === "voice")
                channelNames.push(channels[i].name.toLowerCase());
        }

        let result = NameResolution.bestMatchOfArray(inputLower, channelNames);
        if (result != undefined) {
            // This is kinda lazy
            for (let i = 0; i < channels.length; i++) {
                if (channels[i].name.toLowerCase() === result) {
                    return channels[i] as VoiceChannel;
                }
            }
            return guild.channels.get(result) as VoiceChannel;
        }

        return undefined;
    }

    /**
     * Gets the best match out of a group of strings
     * @param target The target string to match
     * @param attempts The strings that are trying to match to the voice channel
     */
    public static bestMatch(target: string, attempts: Array<string>): string | undefined {
        let result: string | undefined = undefined;
        let potential: string | undefined = undefined;
        let currentDistance = 1.0;

        for (let i = 0; i < attempts.length; i++) {
            if (attempts[i].startsWith(target))
                potential = attempts[i];

            let levenshtein = NameResolution.computeLevenshteinDistance(target, attempts[i]) / attempts[i].length;
            if (levenshtein < levenshteinThreshold && levenshtein < currentDistance) {
                currentDistance = levenshtein;
                result = attempts[i];
            }
        }

        if (result == undefined)
            result = potential;

        return result;
    }

    /**
     * Gets the best match out of a group of strings
     * @param potentialTargets The target strings to try and match with
     * @param attempts The strings that are trying to match to the voice channel
     */
    public static bestMatchOfArray(potentialTargets: Array<string>, attempts: Array<string>): string | undefined {
        let result: string | undefined = undefined;
        let potential: string | undefined = undefined;
        let currentDistance = 1.0;

        for (let i = 0; i < potentialTargets.length; i++) {
            for (let j = 0; j < attempts.length; j++) {
                if (attempts[j].startsWith(potentialTargets[i]))
                    potential = attempts[j];

                let levenshtein = NameResolution.computeLevenshteinDistance(potentialTargets[i], attempts[j]) / attempts[j].length;
                if (levenshtein < levenshteinThreshold && levenshtein < currentDistance) {
                    currentDistance = levenshtein;
                    result = attempts[j];
                }
            }
        }

        if (result == undefined)
            result = potential;

        return result;
    }

    /**
     * Compares two names and returns the result
     * @param first The first name in the comparison
     * @param second The second name in the comparison
     */
    public static compareNames(first: string, second: string): boolean {
        return (first === second ||
                NameResolution.testLevenshteinDistance(first, second) ||
                second.startsWith(first));
    }

    /**
     * Compares two strings to each other on the basis of Levenshtein distance and returns the result
     * @param first The first name in the comparison
     * @param second The second name in the comparison
     */
    public static testLevenshteinDistance(first: string, second: string): boolean {
        let distance = NameResolution.computeLevenshteinDistance(first, second);

        return (distance / second.length) < levenshteinThreshold;
    }

    /**
     * Compares two strings to each other on the basis of Levenshtein distance and returns the result
     * @param first The first name in the comparison
     * @param second The second name in the comparison
     */
    public static computeLevenshteinDistance(first: string, second: string): number {
        let n = first.length;
        let m = second.length;
        let d: Array<Array<number>> = [];
        for (let i = 0; i <= Math.max(n, m); i++) {
            d[i] = [];
        }

        if (n === 0)
            return m;

        if (m == 0)
            return n;

        for (let i = 0; i <= n; d[i][0] = i++) { }
        for (let j = 0; j <= m; d[0][j] = j++) { }

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                let cost = (second[j - 1] == first[i - 1]) ? 0 : 1;

                d[i][j] = Math.min(
                    Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1),
                    d[i - 1][j - 1] + cost);
            }
        }

        return d[n][m];
    }

    /**
     * Parses the args of the command into separate strings including special provisions for args encased in quotes
     * @param args The args to parse
     */
    public static parseArgsIntoArray(args: string): Array<string> | undefined {
        let parsedArgs = new Array<string>();
        args = args.trim();

        let spaceArg: boolean = false;
        let spaceArgUsed: boolean = false;
        let currentArg: string = "";
        for (let i = 0; i < args.length; i++) {
            if (args.charAt(i) === " " && !spaceArg) {
                if (currentArg.length > 0) {
                    parsedArgs.push(currentArg);
                    currentArg = "";
                }

                continue;
            }
            else if (args.charAt(i) === "\"") {
                if (spaceArg) {
                    if (currentArg.length > 0)
                        parsedArgs.push(currentArg);
                    spaceArg = false;
                }
                else
                    spaceArg = true;
                spaceArgUsed = true;
                continue;
            }

            currentArg += args.charAt(i);
        }

        if (currentArg.length > 0)
            parsedArgs.push(currentArg);

        if ((!spaceArgUsed) && parsedArgs.length > 1) {
            parsedArgs.push(args);
        }

        if (parsedArgs.length === 0)
            return undefined;

        return parsedArgs;
    }

    /**
     * Converts an entire array of strings to lowercase
     * @param input The input array to process
     */
    private static stringArrayToLower(input: Array<String>): Array<string> {
        let returnArray = new Array<string>();
        for (let i = 0; i < input.length; i++) {
            returnArray.push(input[i].toLowerCase());
        }

        return returnArray;
    }
}
