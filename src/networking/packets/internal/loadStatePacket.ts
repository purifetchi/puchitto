import { NetworkWriter } from "../../networkWriter";
import { PuchittoPacket } from "../puchittoPacket";
import type { LoadState } from "./loadState/loadState";

/**
 * The load update state packet sent to the server.
 */
export interface LoadStatePacket extends PuchittoPacket {
    /**
     * The current load state.
     */
    state: LoadState
}

/**
 * Writes a load state packet.
 * @param pkt The packet.
 * @param nw The network writer.
 */
export const writeLoadStatePacket = (pkt: LoadStatePacket, nw: NetworkWriter) => {
    nw.writeInt32(pkt.state)
}
