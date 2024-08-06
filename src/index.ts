import { GifClient } from "./class/GifClient";
import InterfaceEx from "./class/ReadlineEx";

;(async()=>{

    const token = await new InterfaceEx().ask("Provide your token here: ", true)
    const client = new GifClient(token)

    console.log("Grabbing gifs...")
    const gifs = await client.getGifs()
    const gifsSize = Object.keys(gifs).length

    console.log(`Validating ${gifsSize} gif${gifsSize > 1 ? "s" : ""}...`)
    const validGifs = await client.validateGifs(gifs)
    const validGifsSize = Object.keys(validGifs).length

    console.log(`Got ${validGifsSize} valid gifs... saving them.`)
    const didSave = await client.saveGifs(validGifs);

    console.log(
        didSave ? `Successfully validated and saved ${validGifsSize} gif${validGifsSize > 1 ? "s" : ""}!`
        : "Something went wrong... maybe discord updated their servers. If so, this app WON'T work anymore."
    )

    setTimeout(process.exit, 5_000) // Delay before closing

})();