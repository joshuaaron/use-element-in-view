import { MutableRefObject, useRef } from 'react';

export function useLatest<T>(value: T): MutableRefObject<T> {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}

export function isRefObject(x: any): x is MutableRefObject<HTMLElement> {
    return x && typeof x === 'object' && 'current' in x;
}

export function hasSupport() {
    return (
        typeof window !== 'undefined' &&
        'IntersectionObserver' in window &&
        'IntersectionObserverEntry' in window &&
        'intersectionRatio' in IntersectionObserverEntry.prototype
    );
}
