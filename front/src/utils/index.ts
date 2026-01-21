export function throttle<T extends (...args: any[]) => void>(
    fn: T,
    delay: number
): (...args: Parameters<T>) => void {
    let isThrottled = false

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        if (isThrottled) return

        fn.apply(this, args)
        isThrottled = true

        setTimeout(() => {
            isThrottled = false
        }, delay)
    }
}

export function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay: number,
    immediate = false
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
        const callNow = immediate && !timeoutId
        const context = this

        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            timeoutId = null
            if (!immediate) {
                fn.apply(context, args)
            }
        }, delay)

        if (callNow) {
            fn.apply(context, args)
        }
    }
}

