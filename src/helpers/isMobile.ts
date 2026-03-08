/**
 * Are we running on mobile?
 */
export const isMobileDevice = () => {
    if (typeof navigator === 'undefined') {
        return false
    }

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
}

/**
 * Are we running within a mobile viewport?
 * @param maxWidth The maximum width to consider.
 */
export const isMobileViewport = (maxWidth: number) => {
    if (typeof window === 'undefined') {
        return false
    }

    return window.matchMedia(`(max-width: ${maxWidth}px)`).matches
}