import { useEffect, useState, useRef, useCallback, RefObject, RefCallback, useMemo } from 'react';
import { useLatest, hasSupport, isRefObject } from './helpers';

export interface IElementInViewOptions<T> extends IntersectionObserverInit {
    ref?: T | RefObject<T> | null;
    defaultInView?: boolean;
    disconnectOnceVisible?: boolean;
    onChange?: (entry: IntersectionObserverEntry) => void;
}

interface IElementInViewResult<T> {
    readonly inView: boolean;
    readonly entry: IntersectionObserverEntry | undefined;
    readonly assignRef: RefCallback<T>;
    readonly disconnect: () => void;
}

interface IElementInViewState {
    entry?: IntersectionObserverEntry;
    elementInView: boolean;
}

export function useElementInView<T extends HTMLElement = HTMLElement>({
    ref: forwardedRef = null,
    root = null,
    rootMargin = '0px',
    threshold = 0,
    defaultInView = false,
    disconnectOnceVisible = false,
    onChange,
}: IElementInViewOptions<T> = {}): IElementInViewResult<T> {
    const [observerEntry, setObserverEntry] = useState<IElementInViewState>({
        entry: undefined,
        elementInView: defaultInView,
    });

    // Store our Intersection Observer instance to a ref for its lifecycle.
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);

    // Element refs. We store the previously tracked element to ensure we only update when the element has changed
    // Along with the element supplied via the callback ref.
    const callbackElementRef = useRef<T | null>(null);
    const prevTrackedElementRef = useRef<T | null>(null);

    // Helper refs.
    const isObservingRef = useRef<boolean>(false);
    const onChangeRef = useLatest<IElementInViewOptions<T>['onChange'] | undefined>(onChange);

    // Store the threshold as a primitive value to ensure it doesn't change in the deps array
    // for registerObserver fn when the consumer passes in an inline array.
    // eg: threshold: [0.25, 0.5] => will be diffed as a new array each render
    const memoizedThreshold = useMemo(() => {
        return Array.isArray(threshold) ? threshold.join() : threshold;
    }, [threshold]);

    const observeElement = useCallback((node: T) => {
        if (isObservingRef.current || !observerInstanceRef.current) {
            return;
        }

        isObservingRef.current = true;
        observerInstanceRef.current.observe(node);
    }, []);

    const disconnect = useCallback(() => {
        if (!isObservingRef.current || !observerInstanceRef.current) {
            return;
        }

        observerInstanceRef.current.disconnect();

        // clear all refs
        observerInstanceRef.current = null;
        isObservingRef.current = false;
        prevTrackedElementRef.current = null;
    }, []);

    // Instantiates the Intersection Observer.
    // It will determine the element based off how it was provided
    // and return a warning if no element was found via the options to assign one.
    const registerObserver = useCallback(() => {
        if (!hasSupport()) {
            return;
        }

        let element: T | null = null;
        if (callbackElementRef.current) {
            element = callbackElementRef.current;
        } else if (forwardedRef instanceof HTMLElement) {
            element = forwardedRef;
        } else if (isRefObject(forwardedRef)) {
            element = forwardedRef.current;
        }

        // Don't update or recall the register function unless the element has changed.
        if (prevTrackedElementRef.current === element) return;
        prevTrackedElementRef.current = element;

        if (!element) {
            // eslint-disable-next-line
            console.warn(
                '🚨 No element has been found, are you sure you correctly assigned a ref?'
            );
            return;
        }

        // Take our stored threshold and transform it to `number | number[]` that is required
        // for the IntersectionObserverInit option
        const transformedThreshold =
            typeof memoizedThreshold === 'string'
                ? memoizedThreshold.split(',').map((value) => parseFloat(value))
                : memoizedThreshold;

        // Ensure we only create the instance once
        if (!observerInstanceRef.current) {
            const instance = new IntersectionObserver(
                ([entry]: IntersectionObserverEntry[]) => {
                    const isIntersecting =
                        entry.isIntersecting &&
                        instance.thresholds.some(
                            (threshold) => entry.intersectionRatio >= threshold
                        );

                    // Disconnect the instance once the observed entry is in view, and option to disconnectOnceVisible has been set
                    if (isIntersecting && disconnectOnceVisible) {
                        disconnect();
                    }

                    if (onChangeRef.current) {
                        onChangeRef.current(entry);
                    } else {
                        setObserverEntry({ entry, elementInView: isIntersecting });
                    }
                },
                { root, rootMargin, threshold: transformedThreshold }
            );

            observerInstanceRef.current = instance;
        }

        observeElement(element);
    }, [
        root,
        rootMargin,
        memoizedThreshold,
        disconnectOnceVisible,
        observeElement,
        disconnect,
        forwardedRef,
        onChangeRef,
    ]);

    const callbackRef = useCallback(
        (node: T) => {
            if (node) {
                callbackElementRef.current = node;
                registerObserver();
            }
        },
        [registerObserver]
    );

    useEffect(() => {
        if (forwardedRef) {
            registerObserver();
        }

        return () => {
            disconnect();
        };
    }, [forwardedRef, registerObserver, disconnect]);

    return {
        entry: observerEntry.entry,
        inView: observerEntry.elementInView,
        assignRef: callbackRef,
        disconnect,
    } as const;
}
