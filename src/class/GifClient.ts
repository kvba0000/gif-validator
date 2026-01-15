import type { GifList } from "../types/GifClient";

import { platform, arch } from "os";
import { FrecencyUserSettings } from "discord-protos";
import { randomUUID } from "crypto";

type ReqOptions = {
    method: "GET" | "PATCH" | "HEAD";
    body?: Record<string, any> | URLSearchParams | string;
    handleError?: boolean;
};

type GifResponse<T = any> = {
    res: T extends Record<string, any>
        ? Omit<Response, "json"> & { json: () => Promise<T> }
        : Response;
    data: T;
};

enum ProtoType {
    PRELOADED_USER_SETTINGS = 1,
    FRECENCY_AND_FAVORITES_SETTINGS = 2,
    TEST_SETTINGS = 3,
}

/** Main client class for this project */
export default class GifClient {
    private static readonly USER_INFO = {
        os: platform() === "win32" ? "Windows" : "Linux",
        arch: arch() === "x64" ? "x86_64" : "x86",
        chromeVersion: "136.0.0.0",
    } as const;
    private static readonly USER_AGENT =
        `Mozilla/5.0 (X11; ${GifClient.USER_INFO.os} ${GifClient.USER_INFO.arch}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${GifClient.USER_INFO.chromeVersion} Safari/537.36` as const;
    private static readonly VALID_MIMETYPES = ["image/", "video/"] as const;

    /** Gets url of protobuf endpoint */
    private static getUrl = (type: ProtoType) =>
        `https://discord.com/api/v9/users/@me/settings-proto/${type}` as const;

    /**
     * Handles potential response errors or does nothing on successful response
     * @param res Response body
     * @param method Method of the request. Used for logging purposes
     * @returns
     */
    private static async handleResError(res: Response, method: string) {
        if (res.ok) return;

        throw new Error(
            `[${res.status}] Error when sending ${method} to "${
                res.url
            }"!\n${await res.text()}`
        );
    }

    /**
     * Parses response body to it's valid type (or returns as text if couldn't detect)
     * @param res Response object
     */
    private static async parseResBody<T extends ReqOptions["body"] = any>(
        res: Response
    ): Promise<T> {
        const contentType = res.headers.get("content-type") ?? "text/plain";

        switch (contentType) {
            case "application/x-www-form-urlencoded":
                return new URLSearchParams(await res.text()) as T;
            case "application/json":
                return (await res.json()) as T;
            default:
                return (await res.text()) as T;
        }
    }

    private readonly superProperties: string = (() => {
        const props = {
            os: GifClient.USER_INFO.os,
            browser: "Chrome",
            device: "",
            system_locale: "en-US",
            has_client_mods: false,
            browser_user_agent: GifClient.USER_AGENT,
            browser_version: GifClient.USER_INFO.chromeVersion,
            os_version: "",
            referrer: "",
            referring_domain: "",
            referrer_current: "",
            referring_domain_current: "",
            release_channel: "stable",
            client_build_number: 426030,
            client_event_source: null,
            client_launch_id: randomUUID(),
            launch_signature: randomUUID(),
            client_heartbeat_session_id: randomUUID(),
            client_app_state: "focused",
        };

        return Buffer.from(JSON.stringify(props), "utf-8").toString("base64");
    })();

    private headers: Record<string, string> = {
        accept: "*/*",
        "accept-language": "en-US",
        priority: "u=1, i",
        "sec-ch-ua": `"Not.A/Brand";v="99", "Chromium";v="${
            GifClient.USER_INFO.chromeVersion.split(".")[0]
        }"`,
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": `"${GifClient.USER_INFO.os}"`,
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-debug-options": "bugReporterEnabled",
        "x-discord-locale": "en-US",
        "x-discord-timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "x-super-properties": this.superProperties,
        Referer: "https://discord.com/channels/@me",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    };

    private async req<T extends ReqOptions["body"] = any>(
        url: string,
        options: ReqOptions = { method: "GET", handleError: true }
    ): Promise<GifResponse<T>> {
        if (url.startsWith("//")) url = `https:${url}`;

        const contentType =
            options.method === "GET" || !options.body
                ? null
                : options.body instanceof URLSearchParams
                ? "application/x-www-form-urlencoded"
                : typeof options.body === "object"
                ? "application/json"
                : "text/plain";

        const headers = {
            ...this.headers,
            ...(contentType ? { "content-type": contentType } : {}),
        };

        const body = !contentType
            ? null
            : contentType === "application/json"
            ? JSON.stringify(options.body!)
            : options.body!.toString();

        const res = await fetch(url, {
            headers,
            body,
            method: options.method,
        });

        if (!options.handleError)
            await GifClient.handleResError(res, options.method);

        return {
            res: res as GifResponse["data"],
            data: await GifClient.parseResBody<T>(res),
        };
    }

    constructor(token: string) {
        this.headers["authorization"] = token;
    }

    /**
     * Fetches gifs from server
     * @returns Gifs object
     */
    async getGifs(): Promise<GifList> {
        const {
            data: { settings: encodedSettings },
        } = await this.req<{ settings: string }>(
            GifClient.getUrl(ProtoType.FRECENCY_AND_FAVORITES_SETTINGS)
        );

        const decodedSettings =
            FrecencyUserSettings.fromBase64(encodedSettings);

        const gifs = decodedSettings.favoriteGifs?.gifs;
        if (!gifs)
            throw new Error(
                "Couldn't find GIFs! Perhaps Discord got updated? Please report the issue on the project's repo!"
            );

        return gifs;
    }

    /**
     * Checks gif and removes invalid ones
     * @param url GIF url
     * @returns Is valid?
     */
    async validateGif(url: string): Promise<boolean> {
        const {
            res: { ok, headers },
        } = await this.req(url, {
            handleError: false,
            method: "HEAD",
        });

        if (!ok) return false;

        const contentType = headers.get("content-type");
        return (
            contentType !== null &&
            GifClient.VALID_MIMETYPES.some((mimeType) =>
                contentType.startsWith(mimeType)
            )
        );
    }

    /**
     * Saves gifs and returns if it succedded
     * @param gifs Gifs to save
     * @returns Was save successful?
     */
    async saveGifs(gifs: GifList) {
        const decodedSettings: FrecencyUserSettings = {
            favoriteGifs: {
                gifs,
                hideTooltip: false,
            },
        };

        const encodedSettings: string =
            FrecencyUserSettings.toBase64(decodedSettings);

        const {
            res: { ok },
        } = await this.req(
            GifClient.getUrl(ProtoType.FRECENCY_AND_FAVORITES_SETTINGS),
            {
                method: "PATCH",
                body: { settings: encodedSettings },
            }
        );

        return ok;
    }
}
