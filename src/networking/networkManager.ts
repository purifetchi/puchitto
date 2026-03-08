import { Game } from "../game"
import { NetworkReader } from "./networkReader"
import { NetworkWriter } from "./networkWriter"
import { PacketHandler, PacketProcessor } from "./packets/packetProcessor"
import { PuchittoPacket } from "./packets/puchittoPacket"
import { WebSocketListener } from "./webSocketListener"

/**
 * The class managing all network related things in Puchitto.
 */
export class NetworkManager {
    /**
     * The packet processor.
     */
    private _packetProcessor : PacketProcessor

    /**
     * The WebSocket listener for the current network manager.
     */
    private _webSocketListener : WebSocketListener

    /**
     * The game this network manager is tied to.
     */
    private _game : Game

    /**
     * The array holding the sequence number.
     */
    private _seq : Int32Array

    /**
     * Constructs a new network manager.
     * @param opts The options.
     */
    constructor(opts: {
        url: string,
        game: Game
    }) {
        const { url, game } = opts
        this._game = game

        this._packetProcessor = new PacketProcessor(this._game)
        this._webSocketListener = new WebSocketListener(url)

        this._seq = new Int32Array(1)
    }

    /**
     * Starts the networking subsystem.
     */
    start() {
        if (this._webSocketListener.listening) {
            throw new Error("The game is already listening!")
        }

        this._webSocketListener.onData = async (nr: NetworkReader) => {
            await this._packetProcessor.processIncomingPacket(nr)
        }

        this._webSocketListener.onError = async (ev: Event) => {
            this._game.eventStream.emit("connectionFailure", ev)
        }

        this._webSocketListener.listen()
    }

    /**
     * Adds a new packet handler.
     * @param opCode The opcode of the packet.
     * @param handler The packet's handler.
     */
    addPacketHandler(opCode: number, handler: PacketHandler) {
        this._packetProcessor.on(opCode, handler)
    }

    /**
     * Sends a packet.
     * @param packet The packet.
     * @param serializer The serialization method.
     */
    send<T extends PuchittoPacket>(packet: T, serializer: (pkt: T, nw: NetworkWriter) => void) {
        // TODO: Pool NetworkWriters
        const nw = new NetworkWriter()

        const seq = Atomics.add(this._seq, 0, 1)
        const opCode = packet.type
        nw.writeInt32(seq)
        nw.writeInt32(opCode)

        const lengthPos = nw.position
        nw.writeInt32(0)

        serializer(packet, nw)

        // Calculate the length
        const totalLength = nw.position
        const length = totalLength - (3 * 4)
        nw.moveTo(lengthPos)
        nw.writeInt32(length)

        const splice = new Uint8Array(nw.buffer, 0, totalLength)
        this._webSocketListener.sendRaw(splice)
    }
}
