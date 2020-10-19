import { useEffect, useState, useRef, useCallback } from 'react';
import { useLatest } from './use-latest';

const DEFAULT_ROOT = null;
const DEFAULT_ROOT_MARGIN = '0px';
const DEFAULT_THRESHOLD = [0];

export interface IElementInViewOptions extends IntersectionObserverInit {
    defaultInView?: boolean;
    disconnectOnceVisible?: boolean;
    onChange?: (entry: IntersectionObserverEntry) => void;
}

interface IElementInViewResult<T> {
    readonly inView: boolean;
    readonly entry: IntersectionObserverEntry | undefined;
    readonly assignRef: (node: T | null) => void;
    readonly disconnect: () => void;
}

interface IElementInViewState {
    entry?: IntersectionObserverEntry;
    elementInView: boolean;
}

export function useElementInView<T extends HTMLElement = HTMLElement>({
    root = DEFAULT_ROOT,
    rootMargin = DEFAULT_ROOT_MARGIN,
    threshold = DEFAULT_THRESHOLD,
    defaultInView = false,
    disconnectOnceVisible = false,
    onChange,
}: IElementInViewOptions = {}): IElementInViewResult<T> {
    const [observerEntry, setObserverEntry] = useState<IElementInViewState>({
        elementInView: defaultInView,
    });
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);
    const isObservingRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);
    const onChangeRef = useLatest<IElementInViewOptions['onChange'] | undefined>(onChange);

    const observe = useCallback((node: T) => {
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

        isObservingRef.current = false;
        observerInstanceRef.current.disconnect();
    }, []);

    const assignRef = useCallback(
        (node: T | null) => {
            const registerInstance = () => {
                const instance = new IntersectionObserver(
                    ([entry]: IntersectionObserverEntry[]) => {
                        const entryInView =
                            entry.isIntersecting &&
                            instance.thresholds.some(
                                (threshold) => entry.intersectionRatio >= threshold
                            );

                        if (entryInView && disconnectOnceVisible) {
                            disconnect();
                        }
                        if (onChangeRef.current) {
                            onChangeRef.current(entry);
                        }

                        if (isMountedRef.current) {
                            setObserverEntry({ entry, elementInView: entryInView });
                        }
                    },
                    { root, rootMargin, threshold }
                );
                return instance;
            };

            if (node) {
                if (!observerInstanceRef.current) {
                    observerInstanceRef.current = registerInstance();
                }

                disconnect(); // disconnect any previous connections
                observe(node);
            }
        },
        [root, rootMargin, threshold, disconnectOnceVisible, observe, disconnect, onChangeRef]
    );

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            disconnect();
        };
    }, [disconnect]);

    return {
        entry: observerEntry.entry,
        inView: observerEntry.elementInView,
        disconnect,
        assignRef,
    } as const;
}
