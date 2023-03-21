import type { AuthConfig } from '@auth/core/types'
import type { PluginOption } from 'vite'

export const virtualConfigModule = (config: AstroAuthConfig): PluginOption => {
	const virtualModuleId = 'auth:config'
	const resolvedId = '\0' + virtualModuleId

	return {
		name: 'auth-astro-config',
		resolveId: (id) => {
			if (id === virtualModuleId) {
				return resolvedId
			}
		},
		load: (id) => {
			if (id === resolvedId) {
				return `export default ${JSON.stringify(config)}`
			}
		},
	}
}

export interface AstroAuthConfig extends AuthConfig {
	/**
	 * Defines the base path for the auth routes.
	 * @default '/api/auth'
	 */
	prefix?: string
	/**
	 * Defineds wether or not you want the integration to handle the API routes
	 * @default true
	 */
	injectEndpoints?: boolean
}
