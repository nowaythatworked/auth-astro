declare module "auth:config" {
  const config: import('./src/server').AstroAuthConfig;
  export default config;
}
