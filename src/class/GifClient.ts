import type { AxiosResponse } from "axios"
import type { GifsList, ProtoResponse } from "../type/GifClient"

import { ProtoTypes } from "../type/GifClient"

import { FrecencyUserSettings } from "discord-protos"
import axiosd, { Axios } from "axios"


const PROTO_URL = (proto_type: keyof typeof ProtoTypes) => "https://discord.com/api/v9/users/@me/settings-proto/".concat(String(ProtoTypes[proto_type]))

/** Main client class for this project */
export class GifClient {
    req: Axios

    constructor(token: string) {

        this.req = new Axios({
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
            transformResponse: axiosd.defaults.transformResponse,
            transformRequest: axiosd.defaults.transformRequest
         })
    }

    private handleError(res: AxiosResponse<ProtoResponse>) {
        if(res.status >= 400) {
            const { code, message } = res.data
            let msg = (code && message) ? `${code}: ${message}` : JSON.stringify(res.data);
            switch(res.status) {
                case 401: msg = "Invalid token!"; break

            }
            throw new Error(msg)
        }

        return
    }

    /**
     * Grabs list of gifs and returns them
     * @returns Gifs object
     */
    async getGifs(): Promise<GifsList> {
        const resp = await this.req.get<ProtoResponse>(PROTO_URL("FRECENCY_AND_FAVORITES_SETTINGS"))
        this.handleError(resp)

        const { data } = resp

        const {settings: encodedSettings} = data
        const decodedSettings = FrecencyUserSettings.fromBase64(encodedSettings!)

        const gifs = decodedSettings?.["favoriteGifs"]?.["gifs"]
        if(!gifs) throw new Error("Invalid settings! App may have been updated.")

        return gifs
    }

    /**
     * Validates gifs and removes unavailable ones.
     * @param gifs Gifs
     * @returns Valid Gifs
     */
    async validateGifs(gifs: GifsList): Promise<GifsList> {
        let newGifs = Object.assign<GifsList, GifsList>({}, gifs)

        for (let key of Object.keys(gifs)) {
            const resp = await this.req.head(gifs[key].src)
            const isOK = resp.status < 400

            console.log(`${isOK ? "✅" : "❌"} ${key}`)
            if(!isOK) delete newGifs[key]
        }

        return newGifs
    }

    /**
     * Saves gifs and returns if it succedded
     * @param gifs Gifs to save
     * @return Was save successful? 
     */
    async saveGifs(gifs) {
        const decodedSettings: FrecencyUserSettings = {
            favoriteGifs: {
                hideTooltip: false,
                gifs: gifs
            }
        }

        const encodedSettings: string = FrecencyUserSettings.toBase64(decodedSettings);

        const resp = await this.req.patch(PROTO_URL("FRECENCY_AND_FAVORITES_SETTINGS"), {settings: encodedSettings})
        this.handleError(resp)

        return resp.status < 400
    }
}