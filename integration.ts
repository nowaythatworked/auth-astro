import type { AstroIntegration } from "astro";
import { type AstroAuthIntegrationConfig, setConfig } from "./config";
import { dirname } from "path";

export default (config: AstroAuthIntegrationConfig): AstroIntegration => ({
  name: "astro-auth",
  hooks: {
    "astro:config:setup": ({ config: astroConfig, injectRoute, injectScript }) => {
      if (astroConfig.output === 'static') throw new Error('auth-astro requires server-side rendering. Please set output to "server" & install an adapter. See https://docs.astro.build/en/guides/deploy/#adding-an-adapter-for-ssr');

      config.edge ??= false;
      config.authOptions.prefix ??= "/api/auth";
      setConfig(config);

      if (config.injectEndpoints !== false) {
        const currentDir = dirname(import.meta.url);
        injectRoute({
          pattern: config.authOptions.prefix + "/[...auth]",
          entryPoint: currentDir + "/api/[...auth].ts",
        });
      }

      if (globalThis.process && process.versions.node < "19.0.0") {
        injectScript('page-ssr', `import crypto from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = crypto;
if (typeof globalThis.crypto.subtle === "undefined") globalThis.crypto.subtle = crypto.webcrypto.subtle;
if (typeof globalThis.crypto.randomUUID === "undefined") globalThis.crypto.randomUUID = crypto.randomUUID;
`)
      }
    },
  },
});
