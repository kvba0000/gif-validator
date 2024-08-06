import { GifClient } from "./classes/GifClient.js";
import { RL } from "./classes/RL.js";


const token = await RL.readLine("Provide your token here: ", true)

const client = new GifClient(token)

console.log("Grabbing gifs...")
const gifs = await client.getGifs()

console.log(`Validating ${Object.keys(gifs).length} gifs...`)
const validatedGifs = await client.validateGifs(gifs)

console.log(`Got ${Object.keys(validatedGifs).length} valid gifs... saving them.`)
const result = await client.saveGifs(validatedGifs);

if(result) console.log(`Successfully validated and saved ${Object.keys(validatedGifs).length} gifs!`)
else console.log("Something went wrong... maybe discord updated their servers. If so, this app WON'T work anymore.")

setTimeout(process.exit, 5_000) // Delay before closing