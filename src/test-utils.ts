// Mock the callback used to only require the properties we care about for the tests
interface MockedIntersectionObserverCallback {
    (entries: MockedIntersectionObserverEntry[], observer?: IntersectionObserver): void;
}

interface MockedIntersectionObserverEntry {
    target: Element;
    intersectionRatio?: number | number[];
    isIntersecting?: boolean;
}

type Item = {
    callback: MockedIntersectionObserverCallback;
    element: Set<Element>;
};

export const observerMap = new Map<IntersectionObserver, Item>();

// Mock the Intersection Observer API to be able to intercept the observe and disconnect calls used within the hook
export const mockIntersectionObserver = jest.fn((cb, options = {}) => {
    const item = {
        callback: cb,
        element: new Set<Element>(),
    };
    const instance: IntersectionObserver = {
        thresholds: Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0],
        root: options.root ?? null,
        rootMargin: options.rootMargin ?? '0px',
        observe: jest.fn((element: Element) => {
            item.element.add(element);
        }),
        disconnect: jest.fn(),
        unobserve: jest.fn(),
        takeRecords: jest.fn(),
    };

    observerMap.set(instance, item);
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
        throw new Error(
            'No IntersectionObserver instance found for element. Is it still mounted in the DOM?'
        );
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

export function getMockedInstance(element: Element): IntersectionObserver {
    for (let [observer, item] of observerMap) {
        if (item.element.has(element)) {
            return observer;
        }
    }

    throw new Error('Failed to find IntersectionObserver for element. Is it being observed?');
}
