import { createInterface } from "readline/promises";

export const getToken = async () => {
    if (typeof process.env.TOKEN === "string") return process.env.TOKEN;

    const rl = createInterface(process.stdin, process.stdout);

    const token = await rl
        .question("Provide your token here: ")
        .finally(() => rl.close());

    if (!token) throw new Error("You need to provide a token!");
    return token;
};
