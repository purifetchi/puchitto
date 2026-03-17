/**
 * The audio entity data.
 */
export interface AudioEntityData {
    /**
     * The path to the audio data.
     */
    path: string,

    /**
     * Is the audio 3D?
     */
    is3D: boolean,

    /**
     * Should the audio autoplay?
     */
    autoplay: boolean,

    /**
     * Is the audio looping?
     */
    looping: boolean,

    /**
     * The volume of the audio?
     */
    volume: number
}
