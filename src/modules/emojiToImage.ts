import twemoji from "twemoji";

/**
 * Converts an emoji to the URL of its image.
 * 
 * Uses [Twemoji](https://twemoji.twitter.com/) image library
 * 
 * @param emoji A string containing an emoji
 * @returns The URL of the emoji's image
 * 
 * @example
 * emojiToImage("👍"); // "https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/1f44d.png"
 */
export default function emojiToImage(emoji: string): string {
	const codePoint = twemoji.convert.toCodePoint(emoji);
	return `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/72x72/${codePoint}.png`;
}
