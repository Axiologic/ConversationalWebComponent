export * from "./components";

declare global {
  interface Window {
    cardinal: {
      oldCustomTheme?: any;
      customTheme?: any;
      controllers?: any;
      pendingControllerRequests?: any;
    };
  }
}