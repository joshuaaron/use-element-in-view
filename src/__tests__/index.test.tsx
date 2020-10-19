import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { renderHook } from '@testing-library/react-hooks';
import { useElementInView, IElementInViewOptions } from '../use-element-in-view';
import {
    observerMap,
    triggerObserverCallback,
    mockIntersectionObserver,
    getMockedInstance,
} from '../test-utils';

// Helper component to render the hook, and return the result and all utils from the render method from testing-library
const renderElement = (opts?: IElementInViewOptions) => {
    const { result } = renderHook(() => useElementInView(opts));

    const utils = render(
        <div data-testid='wrapper' ref={result.current.assignRef}>
            {result.current.inView.toString()}
        </div>
    );

    return {
        utils,
        result,
    };
};

const onChangeCb = jest.fn();

beforeAll(() => {
    global.IntersectionObserver = mockIntersectionObserver;
    global.IntersectionObserverEntry = jest.fn();
});

afterEach(() => {
    // @ts-ignore
    global.IntersectionObserver.mockClear();
    observerMap.clear();
});

describe('useElementInView', () => {
    it('creates an observer instance from the element with the assigned ref', () => {
        const { utils } = renderElement();
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);
        expect(instance.observe).toHaveBeenCalledWith(wrapper);
    });

    it('element initially is not in view as a default', () => {
        const { result } = renderElement();
        expect(result.current.inView).toBe(false);
    });

    it('element should be in view set initially by options', () => {
        const { result } = renderElement({ defaultInView: true });
        expect(result.current.inView).toBe(true);
    });

    it('inView should be true when the element is intersecting', () => {
        const { utils, result } = renderElement();
        const wrapper = utils.getByTestId('wrapper');

        expect(result.current.inView).toBe(false);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(result.current.inView).toBe(true);
    });

    it('should call onChange with the correct params when the intersection observer callback is called', () => {
        const { utils } = renderElement({ onChange: onChangeCb });
        const wrapper = utils.getByTestId('wrapper');

        expect(onChangeCb).toBeCalledTimes(0);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(onChangeCb).toBeCalledTimes(1);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: false });
        });

        expect(onChangeCb).toBeCalledTimes(2);
        expect(onChangeCb).toBeCalledWith({
            target: wrapper,
            isIntersecting: false,
            intersectionRatio: 0,
        });
    });

    it('should call disconnect when the property disconnectOnceVisible is passed and element is intersecting', () => {
        const { utils } = renderElement({ disconnectOnceVisible: true });
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);

        expect(instance.disconnect).toBeCalledTimes(0); // Called once before connecting a new node;

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(instance.disconnect).toBeCalledTimes(1);
    });

    it('should only be inView when the intersecting ratio is higher than the threshold option passed in', () => {
        const { utils, result } = renderElement({ threshold: [0.5, 1] });
        const wrapper = utils.getByTestId('wrapper');

        // Should initially be out of view
        expect(result.current.inView).toBe(false);

        act(() => {
            triggerObserverCallback({
                target: wrapper,
                isIntersecting: true,
                intersectionRatio: 0.4,
            });
        });

        // Should still report false, even though isIntersecting is true
        expect(result.current.inView).toBe(false);

        act(() => {
            triggerObserverCallback({
                target: wrapper,
                isIntersecting: true,
                intersectionRatio: 0.6,
            });
        });

        // Should now report true
        expect(result.current.inView).toBe(true);
    });

    it('disconnects the instance when the disconnect method is called from the consumer', () => {
        const { utils, result } = renderElement();
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);

        expect(instance.observe).toBeCalled();
        expect(instance.disconnect).toBeCalledTimes(0);

        act(() => {
            result.current.disconnect();
        });

        expect(instance.disconnect).toBeCalledTimes(1);
    });
});
