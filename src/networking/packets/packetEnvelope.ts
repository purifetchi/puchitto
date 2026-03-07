import { NetworkReader } from "../networkReader"

/**
 * The header for Puchitto packets.
 */
export interface PacketEnvelope {
    /**
     * The sequence number.
     */
    seq: number,

    /**
     * The packet opcode.
     */
    opCode: number,

    /**
     * The packet length.
     */
    length: number
}

/**
 * Reads a packet envelope.
 * @param nr The network reader.
 */
export const readEnvelope = (nr: NetworkReader) : PacketEnvelope => {
    const seq = nr.readInt32()
    const opCode = nr.readInt32()
    const length = nr.readInt32()

    return {
        seq: seq,
        opCode: opCode,
        length: length
    }
}
