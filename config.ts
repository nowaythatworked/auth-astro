import { AstroAuthConfig } from "."

export interface AstroAuthIntegrationConfig {
    edge?: boolean,
    authOptions: AstroAuthConfig
}

export const getConfig = (): AstroAuthIntegrationConfig => globalThis.astroAuthIntegrationConfig

export const setConfig = (config: AstroAuthIntegrationConfig) => globalThis.astroAuthIntegrationConfig = config

declare global {
    var astroAuthIntegrationConfig: AstroAuthIntegrationConfig
}