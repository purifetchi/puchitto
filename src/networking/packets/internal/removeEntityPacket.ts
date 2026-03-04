import type NetworkReader from "../../networkReader.js";
import type PuchittoPacket from "../puchittoPacket.js";
import { InternalPacketTypes } from "./internalPacketTypes.js";

/**
 * The entity removal packet sent from the server.
 */
export interface RemoveEntityPacket extends PuchittoPacket {
    /**
     * The entity ID.
     */
    id: string
}

/**
 * Reads an entity removal packet.
 * @param nr The network reader.
 * @returns The read packet.
 */
export const readRemoveEntityPacket = (nr: NetworkReader): RemoveEntityPacket => {
    const id = nr.readString()

    return {
        type: InternalPacketTypes.REMOVE_ENTITY,
        id
    }
}