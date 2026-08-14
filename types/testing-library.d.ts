declare module '@testing-library/react-native' {
  export function render(ui: any): any;
  export function fireEvent(element: any, eventName: string, ...args: any[]): any;
}
