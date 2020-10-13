import { useEffect, useState, useRef, useCallback } from 'react';

const DEFAULT_ROOT = null;
const DEFAULT_ROOT_MARGIN = '0px';
const DEFAULT_THRESHOLD = [0];

interface IElementInViewOptions extends IntersectionObserverInit {
    defaultInView?: boolean;
    disconnectOnceVisible?: boolean;
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
}: IElementInViewOptions = {}): IElementInViewResult<T> {
    const observerInstanceRef = useRef<IntersectionObserver | null>(null);
    const [observerEntry, setObserverEntry] = useState<IElementInViewState>({
        elementInView: defaultInView,
    });
    const isMounted = useRef(true);

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

                            if (isMounted.current) {
                                setObserverEntry({ entry, elementInView: entryInView });
                            }

                            if (entryInView && disconnectOnceVisible) {
                                disconnectInstance();
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
        [root, rootMargin, threshold, disconnectOnceVisible]
    );

    function disconnectInstance() {
        const observer = observerInstanceRef.current;
        if (observer) {
            observer.disconnect();
        }
    }

    useEffect(() => {
        return () => {
            isMounted.current = false;
            disconnectInstance();
        };
    }, []);

    return { entry: observerEntry.entry, inView: observerEntry.elementInView, assignRef } as const;
}
