import { NetworkReader } from "../../networkReader"
import { PuchittoPacket } from "../puchittoPacket"
import { InternalPacketTypes } from "./internalPacketTypes"

/**
 * The hello packet originating from the server.
 */
export interface HelloPacket extends PuchittoPacket {
    branding: string,
    gameRules: string
}

/**
 * Reads the hello packet.
 * @param nr The network reader.
 */
export const readHelloPacket = (nr: NetworkReader) : HelloPacket => {
    const branding = nr.readString()
    const gameRules = nr.readString()

    return {
        type: InternalPacketTypes.HELLO,
        branding: branding,
        gameRules: gameRules
    }
}
