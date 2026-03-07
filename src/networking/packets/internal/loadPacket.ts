import { InternalPacketTypes } from "./internalPacketTypes";

/**
 * The load packet sent to us from the server.
 */
export interface LoadPacket extends PuchittoPacket {
    /**
     * The name of the level.
     */
    levelName: string
}

/**
 * Reads a load packet.
 * @param nr The network reader.
 */
export const readLoadPacket = (nr: NetworkReader): LoadPacket => {
    const levelName = nr.readString()
    return {
        type: InternalPacketTypes.LOAD,
        levelName
    }
}
