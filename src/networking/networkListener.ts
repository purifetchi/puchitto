import { NetworkReader } from "./networkReader"

/**
 * An abstract implementation of a network listener.
 */
export interface NetworkListener {
    /**
     * Called when the listener encounters an error.
     */
    onError? : (ev: Event) => Promise<unknown>

    /**
     * Executed when we have incoming data.
     */
    onData? : (nr: NetworkReader) => Promise<unknown>

    /**
     * Called when the server has disconnected.
     */
    onDisconnect? : (ev: Event) => Promise<unknown>

    /**
     * Is this listener listening?
     */
    get listening(): boolean

    /**
     * Starts listening.
     */
    listen: () => void

    /**
     * Sends raw data.
     * @param data The data.
     */
    sendRaw: (data: Uint8Array) => void
}
