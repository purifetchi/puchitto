import type NetworkReader from "../../networkReader.js"
import type PuchittoPacket from "../puchittoPacket.js"
import { InternalPacketTypes } from "./internalPacketTypes.js"

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