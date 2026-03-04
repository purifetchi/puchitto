import type { Quaternion, Vector3 } from "three"

/**
 * A utility to write structured data into an ArrayBuffer.
 */
export default class NetworkWriter {
    private _buffer: ArrayBuffer
    private _view: Uint8Array
    private _dataView: DataView
    private _offset: number
    
    private static readonly _encoder = new TextEncoder()

    /**
     * Gets the current position of the writer.
     */
    public get position(): number {
        return this._offset;
    }

    /**
     * Gets the underlying ArrayBuffer.
     */
    public get buffer(): ArrayBuffer {
        return this._buffer;
    }

    /**
     * Constructs a new NetworkWriter with an internal ArrayBuffer.
     * @param size The initial size of the buffer in bytes.
     */
    constructor(size: number = 1024 * 10) {
        this._buffer = new ArrayBuffer(size)
        this._view = new Uint8Array(this._buffer)
        this._dataView = new DataView(this._buffer)
        this._offset = 0
    }

    /**
     * Moves to a given position.
     * @param position The position.
     */
    moveTo(position: number) {
        this._offset = position
    }

    /**
     * Resets the offset to 0 for object pooling reuse.
     */
    reset(): void {
        this._offset = 0
    }

    /**
     * Writes a 32-bit signed integer.
     * @param value The value to write.
     */
    writeInt32(value: number): void {
        this._view[this._offset++] = value & 0xFF
        this._view[this._offset++] = (value >> 8) & 0xFF
        this._view[this._offset++] = (value >> 16) & 0xFF
        this._view[this._offset++] = (value >> 24) & 0xFF
    }

    /**
     * Writes a 32-bit floating point value.
     * @param value The value to write.
     */
    writeFloat(value: number): void {
        this._dataView.setFloat32(this._offset, value, true)
        this._offset += 4
    }

    /**
     * Writes a Vector3.
     * @param value The Vector3 to write.
     */
    writeVector3(value: Vector3): void {
        this.writeFloat(value.x)
        this.writeFloat(value.y)
        this.writeFloat(value.z)
    }

    /**
     * Writes a Quaternion.
     * @param value The Quaternion to write.
     */
    writeQuaternion(value: Quaternion): void {
        this.writeFloat(value.x)
        this.writeFloat(value.y)
        this.writeFloat(value.z)
        this.writeFloat(value.w)
    }

    /**
     * Writes a single byte.
     * @param value The value to write.
     */
    writeByte(value: number): void {
        this._view[this._offset++] = value & 0xFF
    }

    /**
     * Writes a boolean value.
     * @param value The value to write.
     */
    writeBoolean(value: boolean): void {
        this._view[this._offset++] = value ? 1 : 0
    }

    /**
     * Writes a string.
     * @param value The string value to write.
     */
    writeString(value: string): void {
        const encodedString = NetworkWriter._encoder.encode(value)
        
        this.writeInt32(encodedString.length)
        
        this._view.set(encodedString, this._offset)
        this._offset += encodedString.length
    }
}