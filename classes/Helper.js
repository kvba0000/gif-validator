/** Helper methods for project */
export class Helper {
    /** Status codes which are taken as OK */
    static statusesOK = [
        ...new Array(8).fill(0).map((_, i) => 200 + i),
        226
    ]

    /**
     * Generates url for proto manipulation
     * @param {1 | 2 | 3} proto_type Type of proto
     * @returns {string} URL
     */
    static PROTO_URL = (proto_type) => "https://discord.com/api/v9/users/@me/settings-proto/".concat(proto_type)

    /**
     * Tries to parse a JSON string to object
     * @param {string} maybeJson String that might be a JSON 
     * @param {boolean} shouldReturnBack Should function return string on error?
     * @returns {object|null} Parsed object if valid JSON | null if invalid
     */
    static tryParseJSON(maybeJson = "", shouldReturnBack = false){
        try {return JSON.parse(maybeJson)}
        catch {return shouldReturnBack ? maybeJson : null}
    }

    /**
     * Checks if status code is an OK response (200-208 & 226)
     * @param {number} status Status code
     * @returns {boolean} Is OK?
     */
    static isOK(status) {
        return Helper.statusesOK.includes(status)
    }
}