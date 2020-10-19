// Mock the callback and the entry with only the properties we wish to test for brevity.
interface MockedIntersectionObserverCallback {
    (entries: MockedIntersectionObserverEntry[], observer?: IntersectionObserver): void;
}

interface MockedIntersectionObserverEntry {
    target: HTMLElement;
    intersectionRatio?: number | number[];
    isIntersecting?: boolean;
}

// Store the element with the entry callback to be able to test/observe the node
// the observe method was called on.
export const observerMap = new Map<IntersectionObserver, ObserverItem>();

type ObserverItem = {
    callback: MockedIntersectionObserverCallback;
    element: Set<HTMLElement>;
};

// Default intersection observer options.
const defaultInitOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0,
};

// Mock the Intersection Observer API to be able to intercept the observe and disconnect calls used within the hook
export const mockIntersectionObserver = jest.fn((callback, options = defaultInitOptions) => {
    const observerItem = {
        element: new Set<HTMLElement>(),
        callback,
    };
    const instance: IntersectionObserver = {
        root: options.root,
        rootMargin: options.rootMargin,
        thresholds: Array.isArray(options.threshold) ? options.threshold : [options.threshold],
        observe: jest.fn((element: HTMLElement) => {
            observerItem.element.add(element);
        }),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
        takeRecords: jest.fn(),
    };

    observerMap.set(instance, observerItem);
    return instance;
});

// This function is used to mock the callback triggered when the intersection observer fires a change on the observed element
// We can mock the return type, to test against the isIntersecting property along with thresholds.
export function triggerObserverCallback({
    target,
    isIntersecting = false,
    intersectionRatio = 0,
}: MockedIntersectionObserverEntry) {
    const observer = getMockedInstance(target);

    if (!observer) {
        throw new Error('No IntersectionObserver instance found, Is the element still mounted?');
    }

    const item = observerMap.get(observer);
    if (item) {
        const entry: MockedIntersectionObserverEntry[] = [
            {
                target,
                isIntersecting,
                intersectionRatio,
            },
        ];

        item.callback(entry, observer);
    }
}

export function getMockedInstance(element: HTMLElement): IntersectionObserver {
    for (let [observer, item] of observerMap) {
        if (item.element.has(element)) {
            return observer;
        }
    }

    throw new Error(
        'Failed to find IntersectionObserver for the provided element. Is it still being observed?'
    );
}
