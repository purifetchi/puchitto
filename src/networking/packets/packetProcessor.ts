import { Game } from "../../game";
import { NetworkReader } from "../networkReader";
import { readEnvelope } from "./packetEnvelope";

/**
 * The type for the packet handler.
 */
export type PacketHandler = (nr: NetworkReader, game: Game) => Promise<unknown>

/**
 * The map of packet handlers.
 */
type HandlerMap = {
    [key: number]: PacketHandler
}

/**
 * The class tasked with processing packets.
 */
export class PacketProcessor {
    /**
     * Contains the map of packet handlers.
     */
    private _handlers: HandlerMap = {}

    /**
     * The game we're bound to.
     */
    private _game: Game

    /**
     * Constructs a new packet processor.
     * @param game The game we're bound to.
     */
    constructor(game: Game) {
        this._game = game
    }

    /**
     * Listerns for a packet.
     * @param opCode The opcode.
     * @param handler The packet handler.
     */
    on(opCode: number, handler: PacketHandler) {
        this._handlers[opCode] = handler
    }

    /**
     * Processes an incoming packet.
     * @param nr The network reader.
     */
    async processIncomingPacket(nr: NetworkReader) {
        const envelope = readEnvelope(nr)

        if (envelope.length < 0 || envelope.length > 1024 * 10) {
            throw new Error(`Invalid payload size for the Puchitto packet ${envelope.length}!`)
        }

        if (envelope.seq < 0) {
            throw new Error(`Invalid sequence number for the Puchitto packet ${envelope.length}!`)
        }

        // Find the handler for the OpCode.
        const handler = this._handlers[envelope.opCode]
        if (handler === undefined) {
            throw new Error(`There doesn't exist a packet handler for opcode ${envelope.opCode}!`)
        }

        await handler(nr, this._game)
    }
}
