import type { AlfHeader } from "./alfHeader";
import { AlfLump } from "./alfLump";

/**
 * An ALF package file handler.
 */
export class AlfPackage {
    private buffer: ArrayBuffer | null;
    private view: DataView | null;
    private textDecoder = new TextDecoder("utf-8");
    private offset = 0;

    public header: AlfHeader | null = null;
    public lumps: AlfLump[] = [];
    public path: string;

    private lumpMap: Map<string, AlfLump> = new Map();

    constructor(data: ArrayBufferLike, path: string = "") {
        this.buffer = data instanceof ArrayBuffer
            ? data
            : (new Uint8Array(data).buffer as unknown as ArrayBuffer);

        this.view = new DataView(this.buffer);
        this.path = path;
        this.parseHeader();
    }

    public static async fetch(url: string): Promise<AlfPackage> {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ALF: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return new AlfPackage(arrayBuffer, url);
    }

    private parseHeader(): void {
        if (!this.view) {
            throw new Error("Object disposed");
        }

        this.offset = 0;

        const h1 = String.fromCharCode(this.view.getUint8(this.offset++));
        const h2 = String.fromCharCode(this.view.getUint8(this.offset++));
        const h3 = String.fromCharCode(this.view.getUint8(this.offset++));
        const h4 = String.fromCharCode(this.view.getUint8(this.offset++));

        const headerStr = h1 + h2 + h3 + h4;
        const flags = this.view.getInt32(this.offset, true); this.offset += 4;
        const count = this.view.getInt32(this.offset, true); this.offset += 4;
        const pointer = this.view.getInt32(this.offset, true); this.offset += 4;

        const isValid = (h1 === 'K' && h2 === 'A' && h3 === 'I' && h4 === '!');
        this.header = { headerStr, flags, count, pointer, isValid };

        if (!isValid) throw new Error(`Invalid Header in ${this.path}`);
        this.parseFileDirectory();
    }

    private parseFileDirectory(): void {
        if (!this.header || !this.view) return;
        this.offset = this.header.pointer;

        for (let i = 0; i < this.header.count; i++) {
            const checksum = this.view.getUint32(this.offset, true); this.offset += 4;
            const size = this.view.getUint32(this.offset, true); this.offset += 4;
            const pointer = this.view.getBigInt64(this.offset, true); this.offset += 8;
            const path = this.read7BitEncodedString();

            const lump = new AlfLump(checksum, size, pointer, path);
            this.lumps.push(lump);

            const normalizedPath = path.replace(/\\/g, '/');
            this.lumpMap.set(normalizedPath, lump);
        }
    }

    public getLump(path: string): AlfLump | undefined {
        if (this.lumpMap.has(path)) {
            return this.lumpMap.get(path);
        }

        if (path.startsWith('/')) {
            const sub = path.substring(1);
            if (this.lumpMap.has(sub)) {
                return this.lumpMap.get(sub);
            }
        }
        return undefined;
    }

    /**
     * Safely reads the bytes for a specific lump.
     */
    public read(lump: AlfLump): Uint8Array {
        const buf = this.buffer;

        if (!buf || !this.view) {
            throw new Error("Object disposed");
        }

        const offset = Number(lump.pointer);
        const slice = buf.slice(offset, offset + lump.size) as ArrayBuffer;

        return new Uint8Array(slice);
    }

    private read7BitEncodedString(): string {
        const buf = this.buffer;
        if (!this.view || !buf) {
            return "";
        }

        let count = 0, shift = 0, byteVal: number;
        do {
            if (shift === 35) {
                throw new Error("Bad 7-bit int format");
            }

            byteVal = this.view.getUint8(this.offset++);
            count |= (byteVal & 0x7F) << shift;
            shift += 7;
        } while ((byteVal & 0x80) !== 0);

        const stringBytes = new Uint8Array(buf, this.offset, count);
        this.offset += count;
        return this.textDecoder.decode(stringBytes);
    }

    public dispose(): void {
        this.buffer = null;
        this.view = null;
        this.lumps = [];
        this.lumpMap.clear();
    }
}
