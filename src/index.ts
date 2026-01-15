import GifClient from "./class/GifClient";
import { getToken } from "./helper";
import { EventEmitter, once } from "events";
import type { GifList } from "./types/GifClient";

const client = new GifClient(await getToken());

console.log("Grabbing gifs...");
const gifs = await client.getGifs();

console.log(`Validating ${Object.keys(gifs).length} gif(s)...`);

const validateAll = async () => {
    const MAX_CONCURENCY = 2 as const;
    const CAN_CONTINUE_SYMBOL = Symbol();
    const signal = new EventEmitter();

    const fixedGifs: GifList = {};

    let working = 0,
        order = 0;
    for (const [k, v] of Object.entries(gifs).toSorted(
        (a, b) => a[1].order - b[1].order
    )) {
        working++;

        const orderId = order++;
        client
            .validateGif(v.src)
            .then((ok) => {
                const slicedK =
                    k.slice(0, process.stdout.columns / 2) +
                    (k.length > process.stdout.columns / 2 ? "..." : "");
                console.log(`[${ok ? "✔️" : "❌"}] ${slicedK}`);

                if (ok) {
                    v.order = orderId;
                    fixedGifs[k] = v;
                }
            })
            .finally(() => {
                working--;
                if (working < MAX_CONCURENCY || working === 0)
                    signal.emit(CAN_CONTINUE_SYMBOL);
            });

        if (working >= MAX_CONCURENCY) await once(signal, CAN_CONTINUE_SYMBOL);
    }

    if (working > 0) await once(signal, CAN_CONTINUE_SYMBOL);

    return fixedGifs;
};

const fixedGifs = await validateAll();
console.log(
    `Invalidated ${
        Object.keys(gifs).length - Object.keys(fixedGifs).length
    } gifs and fixed their order. saving...`
);

await client.saveGifs(fixedGifs);
console.log("Saved! Thank you for using this script!");
