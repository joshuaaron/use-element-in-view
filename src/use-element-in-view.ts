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
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);
    const [observerEntry, setObserverEntry] = useState<IElementInViewState>({
        elementInView: defaultInView,
    });
    const onChangeRef = useLatest<IElementInViewOptions['onChange'] | undefined>(onChange);
    const isMounted = useRef(true);

    const disconnectInstance = useCallback(() => {
        const observer = observerInstanceRef.current;
        if (observer) {
            observer.disconnect();
        }
    }, []);

    const assignRef = useCallback(
        (node: T | null) => {
            const registerInstance = () => {
                if (!observerInstanceRef.current) {
                    const instance = new IntersectionObserver(
                        ([entry]: IntersectionObserverEntry[]) => {
                            const entryInView =
                                entry.isIntersecting &&
                                instance.thresholds.some(
                                    (threshold) => entry.intersectionRatio >= threshold
                                );

                            if (entryInView && disconnectOnceVisible) {
                                disconnectInstance();
                            }
                            if (onChangeRef.current) {
                                onChangeRef.current(entry);
                            }

                            if (isMounted.current) {
                                setObserverEntry({ entry, elementInView: entryInView });
                            }
                        },
                        { root, rootMargin, threshold }
                    );
                    observerInstanceRef.current = instance;
                }

                return observerInstanceRef.current;
            };

            if (node) {
                const observer = registerInstance();
                observer.disconnect(); // disconnect any previous connections
                observer.observe(node);
            }
        },
        [root, rootMargin, threshold, disconnectOnceVisible, disconnectInstance, onChangeRef]
    );

    useEffect(() => {
        return () => {
            isMounted.current = false;
            disconnectInstance();
        };
    }, [disconnectInstance]);

    return { entry: observerEntry.entry, inView: observerEntry.elementInView, assignRef } as const;
}
