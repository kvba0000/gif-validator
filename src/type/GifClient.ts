import type { FrecencyUserSettings_FavoriteGIF } from "discord-protos";

export type ErrorResponse = {
    code: number,
    message: string
}

export type ProtoResponse = {
    settings?: string,
} & Partial<ErrorResponse>


export type GifsList = { [key: string]: FrecencyUserSettings_FavoriteGIF; }

export const ProtoTypes = {
    PRELOADED_USER_SETTINGS: 1,
    FRECENCY_AND_FAVORITES_SETTINGS: 2,
    TEST_SETTINGS: 3
}