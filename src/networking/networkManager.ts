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
        const nw = this._rentNetworkWriter()
        this._writePacketEnvelope(nw, packet.type)
        serializer(packet, nw)
        this._adjustPacketLengthAndSend(nw)
        this._returnNetworkWriter(nw)
    }

    /**
     * Begins a manual send of a packet.
     * @param opCode The packet's OpCode.
     */
    beginManualSend(opCode: number): NetworkWriter {
        const nw = this._rentNetworkWriter()
        this._writePacketEnvelope(nw, opCode)

        return nw
    }

    /**
     * Finishes the manual send of the packet.
     * @param nw The network writer.
     */
    finishManualSend(nw: NetworkWriter) {
        this._adjustPacketLengthAndSend(nw)
        this._returnNetworkWriter(nw)
    }

    /**
     * Rents a network writer.
     * @returns The network writer.
     */
    private _rentNetworkWriter() : NetworkWriter {
        // TODO: Actually rent the network writer. I'll come back to this, I promise.
        return new NetworkWriter()
    }

    /**
     * Returns the rented network writer. For now it's a no-op.
     * @param nw The network writer.
     */
    private _returnNetworkWriter(nw: NetworkWriter) {

    }

    /**
     * Writes the packet envelope.
     * @param nw The network writer.
     * @param opCode The packet's OpCode.
     */
    private _writePacketEnvelope(nw: NetworkWriter, opCode: number) {
        const seq = Atomics.add(this._seq, 0, 1)
        nw.writeInt32(seq)
        nw.writeInt32(opCode)
        nw.writeInt32(0)
    }

    /**
     * Adjusts the length in the packet envelope and sends it.
     * @param nw The network writer.
     */
    private _adjustPacketLengthAndSend(nw: NetworkWriter) {
        const lengthPos = 4 * 2 // 2x int32 (seq, opcode)
        const envelopeSize = 3 * 4 // (seq, opcode, length)

        // Calculate the length
        const totalLength = nw.position
        const length = totalLength - envelopeSize
        nw.moveTo(lengthPos)
        nw.writeInt32(length)

        const splice = new Uint8Array(nw.buffer, 0, totalLength)
        this._webSocketListener.sendRaw(splice)
    }
}
