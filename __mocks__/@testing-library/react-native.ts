import React from 'react';

declare const jest: any;

const parentMap = new WeakMap<object, any>();

export function render(element: React.ReactElement) {
  let tree: any;

  if (typeof element.type === 'function') {
    const ReactSecret = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    const prevDispatcher = ReactSecret?.H;

    const mockDispatcher = {
      readContext: () => null,
      useCallback: (fn: any) => fn,
      useContext: () => null,
      useEffect: () => {},
      useImperativeHandle: () => {},
      useLayoutEffect: () => {},
      useMemo: (fn: any) => fn(),
      useReducer: (reducer: any, initialArg: any, init: any) => [
        init ? init(initialArg) : initialArg,
        jest.fn(),
      ],
      useRef: (initialValue: any) => ({ current: initialValue }),
      useState: (initialState: any) => [
        typeof initialState === 'function' ? initialState() : initialState,
        jest.fn(),
      ],
      useDebugValue: () => {},
      useDeferredValue: (value: any) => value,
      useTransition: () => [false, jest.fn()],
      useId: () => 'test-id',
    };

    if (ReactSecret) {
      ReactSecret.H = mockDispatcher;
    }

    try {
      tree = (element.type as any)(element.props);
    } finally {
      if (ReactSecret) {
        ReactSecret.H = prevDispatcher;
      }
    }
  } else {
    tree = element;
  }

  function findInTree(node: any, predicate: (n: any) => boolean, parent: any = null): any {
    if (!node) return null;
    if (typeof node === 'object' && parent) {
      parentMap.set(node, parent);
    }
    if (predicate(node)) return node;
    const children = node.props?.children;
    if (!children) return null;
    const childArray = Array.isArray(children) ? children : [children];
    for (const child of childArray) {
      if (typeof child === 'string' || typeof child === 'number') {
        if (predicate(child)) {
          const wrapper = { text: child, props: node.props };
          if (node) parentMap.set(wrapper, node);
          return wrapper;
        }
      } else if (child && typeof child === 'object') {
        const found = findInTree(child, predicate, node);
        if (found) return found;
      }
    }
    return null;
  }

  return {
    getByText: (text: string) => {
      const match = findInTree(tree, (n) => {
        if (typeof n === 'string') return n === text;
        if (n?.props?.children === text) return true;
        if (Array.isArray(n?.props?.children) && n.props.children.includes(text)) return true;
        return false;
      });
      if (!match) throw new Error(`Could not find text: ${text}`);
      return match;
    },
    getByPlaceholderText: (placeholder: string) => {
      const match = findInTree(tree, (n) => n?.props?.placeholder === placeholder);
      if (!match) throw new Error(`Could not find placeholder: ${placeholder}`);
      return match;
    },
    getByTestId: (testID: string) => {
      const match = findInTree(tree, (n) => n?.props?.testID === testID);
      if (!match) throw new Error(`Could not find testID: ${testID}`);
      return match;
    },
  };
}

function triggerPress(node: any): void {
  let curr = node;
  while (curr) {
    if (typeof curr.props?.onPress === 'function') {
      curr.props.onPress();
      return;
    }
    curr = parentMap.get(curr);
  }
}

export const fireEvent = Object.assign(
  (node: any, eventName: string) => {
    if (eventName === 'press') {
      triggerPress(node);
    }
  },
  {
    press: (node: any) => {
      triggerPress(node);
    },
  }
);
