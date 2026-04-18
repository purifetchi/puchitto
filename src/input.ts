import { Vector2 } from "three";
import { MOUSE_LEFT, MouseButton } from "./mouse";

/**
 * The class responsible for handling input.
 */
export class Input {
    /**
     * The position of the pointer.
     */
    private _pointer : Vector2 = new Vector2()

    /**
     * The delta movement of the pointer.
     */
    private _delta : Vector2 = new Vector2()

    /**
     * Has the mouse been moved since the last frame?
     */
    private _movedMouse : boolean = false

    /**
     * Is input enabled?
     */
    private _enabled : boolean = true

    /**
     * The array of active scancodes
     */
    private _scanCodeMap : Set<string> = new Set<string>()

    /**
     * The canvas rendered to.
     */
    private _canvas : HTMLCanvasElement

    /**
     * The held buttons.
     */
    private _held : Uint8Array = new Uint8Array(3)

    /**
     * The pressed buttons.
     */
    private _pressed : Uint8Array = new Uint8Array(3)

    /**
     * Constructs a new input class.
     */
    constructor(canvas: HTMLCanvasElement) {
        this._canvas = canvas

        canvas.addEventListener('pointermove', this._updatePointer.bind(this))
        canvas.addEventListener('mousedown', this._mouseDown.bind(this))
        canvas.addEventListener('mouseup', this._mouseUp.bind(this))
        canvas.addEventListener('touchend', this._tapEnd.bind(this))

        window.addEventListener('keydown', this._keyDown.bind(this))
        window.addEventListener('keyup', this._keyUp.bind(this))
    }

    /**
     * Sets whether the input should be enabled.
     * @param enabled Whether input is enabled.
     */
    setEnabledInput(enabled: boolean) {
        this._enabled = enabled

        // Reset everything
        this.reset()
    }

    /**
     * Locks the cursor.
     */
    lockCursor() {
        this._canvas.requestPointerLock()
    }

    /**
     * Unlocks the cursor.
     */
    unlockCursor() {
        document.exitPointerLock()
    }

    /**
     * Updates the position of the pointer.
     * @param evt The mouse event.
     */
    private _updatePointer(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        this._delta.x = evt.movementX
        this._delta.y = evt.movementY

        this._pointer.x = evt.clientX
        this._pointer.y = evt.clientY

        this._movedMouse = true
    }

    /**
     * Sets the mouse button as pressed.
     * @param evt The mouse event.
     */
    private _mouseDown(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        if (evt.button < this._held.length) {
            this._held[evt.button] = 1
            this._pressed[evt.button] = 1
        }
    }

    /**
     * Sets the mouse button as released.
     * @param evt The mouse event.
     */
    private _mouseUp(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        if (evt.button < this._held.length) {
            this._held[evt.button] = 0
        }
    }

    /**
     * Sets a key as pressed.
     * @param evt The keyboard event.
     */
    private _keyDown(evt : KeyboardEvent) : void {
        if (!this._enabled) {
            return
        }

        const tgt = evt.target as HTMLElement
        if (tgt && (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA')) {
            return
        }

        this._scanCodeMap.add(evt.code)
        evt.preventDefault()
    }

    /**
     * Sets a key as released.
     * @param evt The keyboard event.
     */
    private _keyUp(evt : KeyboardEvent) : void {
        this._scanCodeMap.delete(evt.code)

        evt.preventDefault()
    }

    /**
     * Handles tapping.
     * @param evt The touch event.
     */
    private _tapEnd(evt: TouchEvent): void {
        if (!this._enabled) {
            return
        }

        const [touch] = evt.changedTouches
        if (touch === undefined) {
            return
        }

        this._pointer.x = touch.clientX
        this._pointer.y = touch.clientY
        this._pressed[MOUSE_LEFT] = 1
        this._movedMouse = true
    }

    /**
     * Resets the input data.
     */
    reset() : void {
        this._delta.x = 0
        this._delta.y = 0
        this._pressed.fill(0)
        this._movedMouse = false
    }

    /**
     * Checks whether a key is pressed or not.
     * @param keyCode The keycode.
     * @returns Whether it is down.
     */
    keyDown(keyCode: string) : boolean {
        return this._scanCodeMap.has(keyCode)
    }

    /**
     * Checks whether a mouse button has been pressed.
     * @param button The mouse button.
     * @returns Whether it is pressed.
     */
    mousePressed(button: MouseButton) {
        return this._pressed[button] === 1
    }

     /**
     * Checks whether a mouse button is held.
     * @param button The mouse button.
     * @returns Whether it is held.
     */
    mouseHeld(button: MouseButton) {
        return this._held[button] === 1
    }

    /**
     * Checks whether the cursor is locked.
     */
    get cursorLocked() : boolean {
        return document.pointerLockElement === this._canvas
    }

    /**
     * Gets the mouse delta.
     */
    get mouseDelta() : Vector2 {
        return this._delta
    }

    /**
     * Gets the position of the pointer.
     */
    get pointerPosition() : Vector2 {
        return this._pointer
    }

    /**
     * Checks whether the mouse has been moved since the last frame.
     */
    get hasMovedMouse() : boolean {
        return this._movedMouse
    }
}
