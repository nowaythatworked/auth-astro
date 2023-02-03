import { AstroIntegration } from "astro";
import { AstroAuthIntegrationConfig, setConfig } from "./config";
import { dirname } from "path";

export default (config: AstroAuthIntegrationConfig): AstroIntegration => ({
  name: "astro-auth",
  hooks: {
    "astro:config:setup": ({ injectRoute }) => {
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
    },
  },
});
