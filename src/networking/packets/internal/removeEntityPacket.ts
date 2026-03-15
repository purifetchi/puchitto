import { NetworkReader } from "../../networkReader";
import { PuchittoPacket } from "../puchittoPacket";
import { InternalPacketTypes } from "./internalPacketTypes";

/**
 * The entity removal packet sent from the server.
 */
export interface RemoveEntityPacket extends PuchittoPacket {
    /**
     * The entity ID.
     */
    id: number
}

/**
 * Reads an entity removal packet.
 * @param nr The network reader.
 * @returns The read packet.
 */
export const readRemoveEntityPacket = (nr: NetworkReader): RemoveEntityPacket => {
    const id = nr.readInt32()

    return {
        type: InternalPacketTypes.REMOVE_ENTITY,
        id
    }
}
