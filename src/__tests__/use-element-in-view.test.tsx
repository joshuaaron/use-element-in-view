import React from 'react';
import { render } from '@testing-library/react';
import { act } from 'react-test-renderer';
import { renderHook } from '@testing-library/react-hooks';
import { useElementInView, IElementInViewOptions } from '../use-element-in-view';
import {
    observers,
    mockIsIntersecting,
    mockIntersectionObserver,
    getMockedInstance,
} from '../test-utils';

const renderComponent = (opts?: IElementInViewOptions) => {
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
    observers.clear();
});

describe('useElementInView', () => {
    it('creates an observer instance from the element with the assigned ref', () => {
        const { utils } = renderComponent();
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);
        expect(instance.observe).toHaveBeenCalledWith(wrapper);
    });

    it('element initially is not in view as a default', () => {
        const { result } = renderComponent();
        expect(result.current.inView).toBe(false);
    });

    it('element should be in view set initially by options', () => {
        const { result } = renderComponent({ defaultInView: true });
        expect(result.current.inView).toBe(true);
    });

    it('inView should be true when the element is intersecting', () => {
        const { utils, result } = renderComponent();
        const wrapper = utils.getByTestId('wrapper');

        expect(result.current.inView).toBe(false);

        act(() => {
            mockIsIntersecting(wrapper, { isIntersecting: true });
        });

        expect(result.current.inView).toBe(true);
    });

    it('should call onChange with the correct params when the intersection observer callback is called', () => {
        const { utils } = renderComponent({ onChange: onChangeCb });
        const wrapper = utils.getByTestId('wrapper');
        expect(onChangeCb).toBeCalledTimes(0);
        act(() => {
            mockIsIntersecting(wrapper, { isIntersecting: true });
        });

        expect(onChangeCb).toBeCalledTimes(1);

        act(() => {
            mockIsIntersecting(wrapper, { isIntersecting: false });
        });

        expect(onChangeCb).toBeCalledTimes(2);
        expect(onChangeCb).toBeCalledWith({
            isIntersecting: false,
            intersectionRatio: 0,
        });
    });

    it('should call disconnect when the property disconnectOnceVisible is passed and element is intersecting', () => {
        const { utils } = renderComponent({ disconnectOnceVisible: true });
        const wrapper = utils.getByTestId('wrapper');
        const instance = getMockedInstance(wrapper);

        expect(instance.disconnect).toBeCalledTimes(1); // Called once before connecting a new node;

        act(() => {
            mockIsIntersecting(wrapper, { isIntersecting: true });
        });

        expect(instance.disconnect).toBeCalledTimes(2);
    });
});
