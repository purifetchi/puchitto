import { NetworkWriter } from "../../networkWriter"
import { PuchittoPacket } from "../puchittoPacket"

/**
 * The join packet.
 */
export interface JoinPacket extends PuchittoPacket {
    /**
     * The realm link to join, of format realm://name?query=value
     */
    link: string
}

/**
 * Writes a join packet.
 * @param pkt The packet.
 * @param nw The network writer.
 */
export const writeJoinPacket = (pkt: JoinPacket, nw: NetworkWriter) => {
    nw.writeString(pkt.link)
}
