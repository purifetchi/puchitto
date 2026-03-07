import { Quaternion, Vector3 } from "three"

/**
 * A utility to read structured data from an ArrayBuffer.
 */
export class NetworkReader {
    /**
     * The DataView providing access to the buffer.
     */
    private _view!: DataView

    /**
     * The current reading offset.
     */
    private _offset: number = 0

    /**
     * An internal decoder for UTF-8 strings.
     */
    private _decoder = new TextDecoder('utf-8')

    /**
     * Sets the buffer and resets the offset.
     * @param buffer The array buffer being read.
     */
    set(buffer: ArrayBuffer) {
        this._view = new DataView(buffer)
        this._offset = 0
    }

    /**
     * Gets the current position of the reader.
     */
    get position(): number {
        return this._offset
    }

    /**
     * Reads a 32-bit signed integer (Little Endian).
     */
    readInt32(): number {
        const value = this._view.getInt32(this._offset, true)
        this._offset += 4
        return value
    }

    /**
     * Reads a 32-bit floating point value.
     */
    readFloat(): number {
        const value = this._view.getFloat32(this._offset, true)
        this._offset += 4
        return value
    }

    /**
     * Reads a Vector3.
     */
    readVector3(): Vector3 {
        const x = this.readFloat()
        const y = this.readFloat()
        const z = this.readFloat()

        return new Vector3(x, y, z)
    }

    /**
     * Reads a Quaternion.
     */
    readQuaternion(): Quaternion {
        const x = this.readFloat()
        const y = this.readFloat()
        const z = this.readFloat()
        const w = this.readFloat()

        return new Quaternion(x, y, z, w)
    }

    /**
     * Reads a single byte.
     */
    readByte(): number {
        return this._view.getUint8(this._offset++)
    }

    /**
     * Reads a boolean value (non-zero = true).
     */
    readBoolean(): boolean {
        return this.readByte() !== 0
    }

    /**
     * Reads a UTF-8 string prefixed by an Int32 length.
     */
    readString(): string {
        const length = this.readInt32()

        // Create a view of the specific string bytes
        const stringBytes = new Uint8Array(
            this._view.buffer,
            this._view.byteOffset + this._offset,
            length
        )

        this._offset += length
        return this._decoder.decode(stringBytes)
    }
}
