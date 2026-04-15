import { Vector2 } from "three";

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
     * Was the left mouse button pressed?
     */
    private _lmbPressed : boolean = false

    /**
     * Was left mouse button held?
     */
    private _lmbHeld : boolean = false

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

        this._lmbPressed = true
        this._lmbHeld = true
    }

    /**
     * Sets the mouse button as released.
     * @param evt The mouse event.
     */
    private _mouseUp(evt : MouseEvent) : void {
        if (!this._enabled) {
            return
        }

        this._lmbHeld = false
    }

    /**
     * Sets a key as pressed.
     * @param evt The keyboard event.
     */
    private _keyDown(evt : KeyboardEvent) : void {
        if (!this._enabled) {
            return
        }

        this._scanCodeMap.add(evt.code)
    }

    /**
     * Sets a key as released.
     * @param evt The keyboard event.
     */
    private _keyUp(evt : KeyboardEvent) : void {
        this._scanCodeMap.delete(evt.code)
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
        this._lmbPressed = true
        this._movedMouse = true
    }

    /**
     * Resets the input data.
     */
    reset() : void {
        this._delta.x = 0
        this._delta.y = 0
        this._lmbPressed = false
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
     * Checks if the mouse was pressed this frame.
     */
    get mousePressed() : boolean {
        return this._lmbPressed
    }

    /**
     * Checks if the mouse was held.
     */
    get mouseHeld() : boolean {
        return this._lmbHeld
    }

    /**
     * Checks whether the mouse has been moved since the last frame.
     */
    get hasMovedMouse() : boolean {
        return this._movedMouse
    }
}
