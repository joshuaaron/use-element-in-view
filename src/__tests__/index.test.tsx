import React, { useRef } from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { renderHook } from '@testing-library/react-hooks';
import { useElementInView, IElementInViewOptions } from '../';
import * as helpers from '../helpers';
import {
    observerMap,
    triggerObserverCallback,
    mockIntersectionObserver,
    getMockedInstance,
} from '../test-utils';

const onChangeMock = jest.fn();
const hasSupportMock = jest.spyOn(helpers, 'hasSupport');

beforeAll(() => {
    global.IntersectionObserver = mockIntersectionObserver;
    global.IntersectionObserverEntry = jest.fn();
    hasSupportMock.mockReturnValue(true);
});

afterEach(() => {
    // @ts-ignore
    global.IntersectionObserver.mockClear();
    observerMap.clear();
    hasSupportMock.mockClear();
});

// Helper component to render the hook, and return the result
// and all utils from the render method from testing-library
const renderElement = (opts?: IElementInViewOptions<any>, mount = true) => {
    const { result } = renderHook(() => useElementInView(opts));
    const utils = render(
        <div data-testid='wrapper' ref={mount ? result.current.assignRef : null}>
            {result.current.inView.toString()}
        </div>
    );

    return {
        utils,
        result,
    };
};

// To test a regular react ref, we need a regular component.
// renderHook utility can't be used as our hook will be inside a callback which breaks the rules of hooks
const RenderWithRefComponent = (opts?: IElementInViewOptions<any>) => {
    const ref = useRef<HTMLDivElement | null>(null);
    const result = useElementInView({ ...opts, ref });

    return (
        <div data-testid='wrapper-ref' ref={ref}>
            {result.inView.toString()}
        </div>
    );
};

describe('use-element-in-view', () => {
    it('should not create an instance if no refs have been supplied or assigned to an element', () => {
        const { utils, result } = renderElement({}, false);
        const wrapper = utils.getByTestId('wrapper');

        expect(result.current.entry).toBe(undefined);
        expect(() => getMockedInstance(wrapper)).toThrowError();
    });

    it('should not create an instance if the Intersection Observer is not supported', () => {
        hasSupportMock.mockReturnValueOnce(false);

        const { utils, result } = renderElement();
        const wrapper = utils.getByTestId('wrapper');

        expect(result.current.entry).toBe(undefined);
        expect(() => getMockedInstance(wrapper)).toThrowError();
    });

    it('should create an instance if the ref is supplied from the user', () => {
        const { getByTestId } = render(<RenderWithRefComponent />);
        const wrapper = getByTestId('wrapper-ref');
        const instance = getMockedInstance(wrapper);

        expect(instance.observe).toHaveBeenCalledWith(wrapper);
    });

    it('should create an instance if the ref is attached via the callback ref', () => {
        const { utils } = renderElement();
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);

        expect(instance.observe).toHaveBeenCalledWith(wrapper);
    });

    it('should initially show the element not in view as default', () => {
        const { result } = renderElement();

        expect(result.current.inView).toBe(false);
    });

    it('should report element to be in view when initially set by options', () => {
        const { result } = renderElement({ defaultInView: true });

        expect(result.current.inView).toBe(true);
    });

    it('should report inView as true when the element is intersecting', () => {
        const { utils, result } = renderElement();
        const wrapper = utils.getByTestId('wrapper');

        expect(result.current.inView).toBe(false);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(result.current.inView).toBe(true);
    });

    it('should call onChange with the correct params when the intersection observer callback is called', () => {
        const { utils } = renderElement({ onChange: onChangeMock });
        const wrapper = utils.getByTestId('wrapper');

        expect(onChangeMock).toBeCalledTimes(0);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(onChangeMock).toBeCalledTimes(1);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: false });
        });

        expect(onChangeMock).toBeCalledTimes(2);
        expect(onChangeMock).toBeCalledWith({
            target: wrapper,
            isIntersecting: false,
            intersectionRatio: 0,
        });
    });

    it('should call disconnect when the property disconnectOnceVisible is passed and element is intersecting', () => {
        const { utils } = renderElement({ disconnectOnceVisible: true });
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);

        expect(instance.disconnect).toBeCalledTimes(0);

        act(() => {
            triggerObserverCallback({ target: wrapper, isIntersecting: true });
        });

        expect(instance.disconnect).toBeCalledTimes(1);
    });

    it('should only be inView when the intersecting ratio is higher than the threshold passed in', () => {
        const { utils, result } = renderElement({ threshold: [0.5] });
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

    it('should disconnect the instance when the disconnect method is called from the consumer', () => {
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
