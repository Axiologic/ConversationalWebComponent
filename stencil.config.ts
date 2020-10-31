import { Config } from "@stencil/core";
import "./bin/remove_warnings_plugin.js";

export interface CustomComponentsConfig extends Config {
  readonly useBootstrap: boolean;
}

export const config: CustomComponentsConfig = {
  namespace: "conversational-web-component",
  plugins: [global.removeWarnings()],
  outputTargets: [
    {
      type: "dist",
      esmLoaderPath: "../loader",
    },
    {
      type: "docs-readme",
    },
    {
      type: "www",
      serviceWorker: null, // disable service workers
    },
  ],
  buildEs5: false,
  extras: {
    cssVarsShim: false,
    dynamicImportShim: false,
    safari10: false,
    scriptDataOpts: false,
    shadowDomShim: false,
  },
  useBootstrap: true,
};
