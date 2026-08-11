import React from 'react';

declare const jest: any;

const parentMap = new WeakMap<object, any>();

export function render(element: React.ReactElement) {
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
    useSyncExternalStore: (_subscribe: any, getSnapshot: any) => getSnapshot(),
  };

  function evalNode(node: any): any {
    if (!node) return null;
    if (typeof node.type === 'function') {
      if (ReactSecret) ReactSecret.H = mockDispatcher;
      try {
        const res = node.type(node.props);
        return evalNode(res);
      } catch (e) {
        return node;
      } finally {
        if (ReactSecret) ReactSecret.H = prevDispatcher;
      }
    }
    return node;
  }

  const tree = evalNode(element);

  function findInTree(node: any, predicate: (n: any) => boolean, parent: any = null): any {
    if (!node) return null;
    const evaluated = typeof node.type === 'function' ? evalNode(node) : node;
    if (!evaluated) return null;

    if (typeof evaluated === 'object' && parent) {
      parentMap.set(evaluated, parent);
    }
    if (predicate(evaluated)) return evaluated;

    const children = evaluated.props?.children;
    if (!children) return null;
    const childArray = Array.isArray(children) ? children : [children];

    for (const child of childArray) {
      if (typeof child === 'string' || typeof child === 'number') {
        if (predicate(child)) {
          const wrapper = { text: String(child), props: evaluated.props };
          if (evaluated) parentMap.set(wrapper, evaluated);
          return wrapper;
        }
      } else if (child && typeof child === 'object') {
        const found = findInTree(child, predicate, evaluated);
        if (found) return found;
      }
    }
    return null;
  }

  function matchesText(target: any, text: string | RegExp): boolean {
    const textStr = String(target);
    if (text instanceof RegExp) return text.test(textStr);
    return textStr === text;
  }

  return {
    getByText: (text: string | RegExp) => {
      const match = findInTree(tree, (n) => {
        if (typeof n === 'string' || typeof n === 'number') {
          return matchesText(n, text);
        }
        if (n?.props?.children && (typeof n.props.children === 'string' || typeof n.props.children === 'number')) {
          return matchesText(n.props.children, text);
        }
        if (Array.isArray(n?.props?.children)) {
          return n.props.children.some((c: any) => (typeof c === 'string' || typeof c === 'number') && matchesText(c, text));
        }
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
