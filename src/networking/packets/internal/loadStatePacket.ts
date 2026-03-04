import type NetworkWriter from "../../networkWriter.js";
import type PuchittoPacket from "../puchittoPacket.js";
import type { LoadState } from "./loadState/loadState.js";

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