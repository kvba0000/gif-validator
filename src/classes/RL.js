import { createInterface } from "readline"
import { stdin, stdout } from "process"

/** Class for prompting user in terminal */
export class RL {
    constructor() {
        this.interface = createInterface(stdin, stdout)
    }

    /**
     * Prompts user
     * @param {string} question Question for the readline function
     * @param {boolean} require Is method accepting empty strings?
     * @returns {Promise<string>} Answer 
     */
    async readLine(question = "", require = false) {
        const q = (q) => new Promise(resolve => this.interface.question(q, resolve))
        let a = ""

        if(require) while(a.trim().length === 0) a = await q(question)
        else a = await q(question)

        return a
    }

    /**
     * Prompts user staticaally without need of new classes
     * @param {string} question Question for the readline function
     * @param {boolean} require Is method accepting empty strings?
     * @returns {Promise<string>} Answer 
     */
    static async readLine(question = "", require = false) {
        const instance = new RL()
        return instance.readLine(question, require)
    }
}