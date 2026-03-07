import type { Quaternion, Vector3 } from "three";
import { InternalPacketTypes } from "./internalPacketTypes";
import { PuchittoPacket } from "../puchittoPacket";
import { NetworkReader } from "../../networkReader";

/**
 * Sent from the server whenever it wants to create a new entity.
 */
export interface CreateEntityPacket extends PuchittoPacket {
    id: string,
    entityName: string,
    position: Vector3,
    rotation: Quaternion
    scale: Vector3,
    isOwner: boolean,
    jsonEntityData: string
}

/**
 * Reads a create entity packet.
 * @param nr The network reader.
 * @returns The packet.
 */
export const readCreateEntityPacket = (nr: NetworkReader): CreateEntityPacket => {
    const id = nr.readString()
    const entityName = nr.readString()
    const position = nr.readVector3()
    const rotation = nr.readQuaternion()
    const scale = nr.readVector3()
    const isOwner = nr.readBoolean()
    const jsonEntityData = nr.readString()

    return {
        type: InternalPacketTypes.CREATE_ENTITY,

        id,
        entityName,
        position,
        rotation,
        scale,
        isOwner,
        jsonEntityData
    }
}
