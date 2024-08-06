import { Interface } from "readline"
import { stdin, stdout } from "process"

/** Class for prompting user in terminal */
export default class ReadlineEx extends Interface {
    constructor() {
        super({
            input: stdin,
            output: stdout
        })
    }

    /**
     * Prompts user
     * @param question Question for the readline function
     * @param require Is method accepting empty strings?
     * @returns Answer 
     */
    async ask(question: string = "", require: boolean = false): Promise<string> {
        let answer: string|null = null
        while(
            !answer ||
            (require && answer?.trim?.().length === 0)
        ) answer = await new Promise(resolve => this.question(question, resolve))

        return answer
    }
}