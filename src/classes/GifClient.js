import { Helper } from "./Helper.js"
import { FrecencyUserSettings } from "discord-protos"
import { Axios } from "axios"

/** Main client class for this project */
export class GifClient {
    constructor(token) {
        if(!token) throw new Error("No token provided")

        this.axios = new Axios({
            headers: {
                "Authorization": token,
                "accept": "*/*",
                "Content-Type": "application/json",
                "x-discord-locale": "en-US",
                "accept-language": "en-US;q=0.9",
                "Referer": "https://discord.com/channels/@me",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) discord/1.0.9034 Chrome/108.0.5359.215 Electron/22.3.26 Safari/537.36",
                "x-discord-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
                "x-super-properties": "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiRGlzY29yZCBDbGllbnQiLCJyZWxlYXNlX2NoYW5uZWwiOiJzdGFibGUiLCJjbGllbnRfdmVyc2lvbiI6IjEuMC45MDM0Iiwib3NfdmVyc2lvbiI6IjEwLjAuMTkwNDUiLCJvc19hcmNoIjoieDY0IiwiYXBwX2FyY2giOiJpYTMyIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV09XNjQpIEFwcGxlV2ViS2l0LzUzNy4zNiAoS0hUTUwsIGxpa2UgR2Vja28pIGRpc2NvcmQvMS4wLjkwMzQgQ2hyb21lLzEwOC4wLjUzNTkuMjE1IEVsZWN0cm9uLzIyLjMuMjYgU2FmYXJpLzUzNy4zNiIsImJyb3dzZXJfdmVyc2lvbiI6IjIyLjMuMjYiLCJjbGllbnRfYnVpbGRfbnVtYmVyIjoyNzEyMTYsIm5hdGl2ZV9idWlsZF9udW1iZXIiOjQ0MTQyLCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ=="
            },
            transformResponse: (data) => Helper.tryParseJSON(data, true),
            transformRequest: (data) => JSON.stringify(data)
         })
    }

    _handleError(response) {
        const json = Helper.tryParseJSON(response);
        if(json) {
            if(json["message"]) {
                if(json["message"] === "401: Unauthorized" && json["code"] === 0) throw new Error("Invalid token!")
                if(!Helper.statusesOK.some(s => json["message"].startsWith(s))) throw new Error(json)
            }
            return true
        }
        return true
    }

    /**
     * Grabs list of gifs and returns them
     * @returns {Promise<{[key: string]: import("discord-protos").FrecencyUserSettings_FavoriteGIF}>} Gifs
     */
    async getGifs() {
        const {data} = await this.axios.get(Helper.PROTO_URL(2))
        this._handleError(data)

        const {settings: encodedSettings} = data
        const decodedSettings = FrecencyUserSettings.fromBase64(encodedSettings)

        return decodedSettings["favoriteGifs"]["gifs"]
    }

    /**
     * Validates gifs and removes unavailable ones.
     * @param {{[key: string]: import("discord-protos").FrecencyUserSettings_FavoriteGIF}} gifs Gifs
     * @returns {Promise<{[key: string]: import("discord-protos").FrecencyUserSettings_FavoriteGIF}>} Valid Gifs
     */
    async validateGifs(gifs) {
        let newGifs = {...gifs}
        for (let key of Object.keys(gifs)) {
            const resp = await this.axios.head(gifs[key].src)
            if(!Helper.isOK(resp.status)) delete newGifs[key]
        }
        return newGifs
    }

    /**
     * Saves gifs and returns if it succedded
     * @param {{[key: string]: import("discord-protos").FrecencyUserSettings_FavoriteGIF}} gifs Gifs to save
     * @return {Promise<boolean>} Was save successful? 
     */
    async saveGifs(gifs) {
        const decodedSettings = {
            favoriteGifs: {
                gifs: gifs
            }
        }
        const encodedSettings = FrecencyUserSettings.toBase64(decodedSettings);

        const {status, data} = await this.axios.patch(Helper.PROTO_URL(2), {settings: encodedSettings})
        this._handleError(data)

        return Helper.isOK(status)
    }
}