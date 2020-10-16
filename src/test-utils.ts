interface MockedIntersectionObserverCallback {
    (entries: MockedIntersectionObserverEntry[], observer?: IntersectionObserver): void;
}

interface MockedIntersectionObserverEntry {
    intersectionRatio: number | number[];
    isIntersecting: boolean;
}

type Item = {
    callback: MockedIntersectionObserverCallback;
    elements: Set<Element>;
};

type TriggerCallbackEvent = {
    isIntersecting?: boolean;
    intersectionRatio?: number | number[];
    item: Item;
    observer?: IntersectionObserver;
};

export const observers = new Map<IntersectionObserver, Item>();

export const mockIntersectionObserver = jest.fn((cb, options = {}) => {
    const item = {
        callback: cb,
        elements: new Set<Element>(),
    };
    const instance: IntersectionObserver = {
        ...options,
        observe: jest.fn((element: Element) => {
            item.elements.add(element);
        }),
        disconnect: jest.fn(),
    };

    observers.set(instance, item);
    return instance;
});

export function mockIsIntersecting(
    element: Element,
    { isIntersecting, intersectionRatio }: Partial<MockedIntersectionObserverEntry>
) {
    const observer = getMockedInstance(element);
    if (!observer) {
        throw new Error(
            'No IntersectionObserver instance found for element. Is it still mounted in the DOM?'
        );
    }
    const item = observers.get(observer);
    if (item) {
        triggerCallback({ item, observer, isIntersecting, intersectionRatio });
    }
}

export function getMockedInstance(element: Element): IntersectionObserver {
    for (let [observer, item] of observers) {
        if (item.elements.has(element)) {
            return observer;
        }
    }

    throw new Error('Failed to find IntersectionObserver for element. Is it being observed?');
}

function triggerCallback({
    isIntersecting = false,
    intersectionRatio = 0,
    item,
    observer,
}: TriggerCallbackEvent) {
    const entries: MockedIntersectionObserverEntry[] = [];
    const entry: MockedIntersectionObserverEntry = {
        isIntersecting,
        intersectionRatio,
    };

    entries.push(entry);
    item.callback([entry], observer);
}
