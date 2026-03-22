import { NetworkReader } from "./networkReader"

/**
 * The WebSocket listener part of the framework.
 */
export class WebSocketListener {
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
     * The WebSocket we've connected to.
     */
    private _webSocket? : WebSocket

    /**
     * The URL of the server.
     */
    private _url : string

    /**
     * Constructs the WebSocket listener.
     * @param url The URL of the server we're connecting to.
     */
    constructor(url: string) {
        this._url = url
    }

    /**
     * Is this listening listening?
     */
    get listening() {
        return this._webSocket !== undefined && this._webSocket.readyState == WebSocket.OPEN
    }

    /**
     * Listens on the WebSocket.
     */
    listen() {
        if (this._webSocket !== undefined) {
            throw new Error("We're already listening on the socket!")
        }

        this._webSocket = new WebSocket(this._url, ["puchitto"])
        this._webSocket.onerror = async (ev) => {
            if (this.onError !== undefined) {
                await this.onError(ev)
            }
        }

        this._webSocket.onmessage = async (msg) => {
            const blob = msg.data as Blob
            const bytes = await blob.arrayBuffer()

            const nr = new NetworkReader();
            nr.set(bytes)

            if (this.onData !== undefined) {
                await this.onData(nr)
            }
        }

        this._webSocket.onclose = async (ev) => {
            if (this.onDisconnect !== undefined) {
                await this.onDisconnect(ev)
            }

            this._webSocket?.close()
            this._webSocket = undefined
        }
    }

    /**
     * Sends raw data.
     * @param data The data.
     */
    sendRaw(data: Uint8Array) {
        this._webSocket?.send(data)
    }

    /**
     * Closes the connection.
     */
    close() {
        this._webSocket?.close()
    }
}
