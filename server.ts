/**
 * > **caution**
 * > `auth-astro` is currently experimental. Be aware of breaking changes between versions.
 *
 *
 * Astro Auth is the unofficial Astro integration for Auth.js.
 * It provides a simple way to add authentication to your Astro site in a few lines of code.
 *
 * ## Installation
 *
 * `auth-astro` requires building your site in `server` mode with a platform adaper like `@astrojs/node`.
 * ```js
 * // astro.config.mjs
 * export default defineConfig({
 *   output: "server",
 *   adapter: node({
 *     mode: 'standalone'
 *   })
 * });
 * ```
 *
 * ```bash npm2yarn2pnpm
 * npm install @auth/core @auth/astro
 * ```
 */
import { Auth } from '@auth/core'
import type { AuthAction, Session } from '@auth/core/types'
import type { APIContext, AstroGlobal } from 'astro'
import { parseString } from 'set-cookie-parser'
import authConfig from 'auth:config'
import type { UserAuthConfig } from './src/config'
import type { ActionAPIContext } from 'astro/dist/actions/runtime/store'

const actions: AuthAction[] = [
	'providers',
	'session',
	'csrf',
	'signin',
	'signout',
	'callback',
	'verify-request',
	'error',
]

function AstroAuthHandler(prefix: string, options = authConfig) {
	return async (ctx: APIContext) => {
		const { cookies, request } = ctx
		const url = new URL(request.url)
		const action = url.pathname.slice(prefix.length + 1).split('/')[0] as AuthAction

		if (!actions.includes(action) || !url.pathname.startsWith(prefix + '/')) return

		const config = isUserConfigLazy(options) ? await options.config(ctx) : options
		const res = await Auth(request, config)
		if (['callback', 'signin', 'signout'].includes(action)) {
			// Properly handle multiple Set-Cookie headers (they can't be concatenated in one)
			const getSetCookie = res.headers.getSetCookie()
			if (getSetCookie.length > 0) {
				getSetCookie.forEach((cookie) => {
					const { name, value, ...options } = parseString(cookie)
					// Astro's typings are more explicit than @types/set-cookie-parser for sameSite
					cookies.set(name, value, options as Parameters<(typeof cookies)['set']>[2])
				})
				res.headers.delete('Set-Cookie')
			}
		}
		return res
	}
}

/**
 * Creates a set of Astro endpoints for authentication.
 *
 * @example
 * ```ts
 * export const { GET, POST } = AstroAuth({
 *   providers: [
 *     GitHub({
 *       clientId: process.env.GITHUB_ID!,
 *       clientSecret: process.env.GITHUB_SECRET!,
 *     }),
 *   ],
 *   debug: false,
 * })
 * ```
 * @param config The configuration for authentication providers and other options.
 * @returns An object with `GET` and `POST` methods that can be exported in an Astro endpoint.
 */
export function AstroAuth(options = authConfig) {
	// @ts-ignore
	const { AUTH_SECRET, AUTH_TRUST_HOST, VERCEL, NODE_ENV } = import.meta.env

	return {
		async GET(context: APIContext) {
			const config = isUserConfigLazy(options) ? await options.config(context) : options
			config.secret ??= AUTH_SECRET
			config.trustHost ??= !!(AUTH_TRUST_HOST ?? VERCEL ?? NODE_ENV !== 'production')

			const { prefix = '/api/auth', ...authOptions } = config
			const handler = AstroAuthHandler(prefix, authOptions)
			return await handler(context)
		},
		async POST(context: APIContext) {
			const config = isUserConfigLazy(options) ? await options.config(context) : options
			config.secret ??= AUTH_SECRET
			config.trustHost ??= !!(AUTH_TRUST_HOST ?? VERCEL ?? NODE_ENV !== 'production')

			const { prefix = '/api/auth', ...authOptions } = config
			const handler = AstroAuthHandler(prefix, authOptions)
			return await handler(context)
		},
	}
}

/**
 * Fetches the current session.
 * @param req The request object.
 * @returns The current session, or `null` if there is no session.
 */
export async function getSession(req: Request, options = authConfig): Promise<Session | null> {
	if (isUserConfigLazy(options)) {
		throw new Error(
			'User Auth Configuration is Lazy. Fetch the session using getSessionByContext().'
		)
	}
	// @ts-ignore
	options.secret ??= import.meta.env.AUTH_SECRET
	options.trustHost ??= true
	const url = new URL(`${options.prefix}/session`, req.url)
	const response = await Auth(new Request(url, { headers: req.headers }), options)
	const { status = 200 } = response

	const data = await response.json()

	if (!data || !Object.keys(data).length) return null
	if (status === 200) return data
	throw new Error(data.message)
}

/**
 * Fetches the current session when using a lazy auth config.
 * @param ctx The Astro global object, or APIContext.
 * @returns The current session, or `null` if there is no session.
 */
export async function getSessionByContext(
	ctx: AstroGlobal | APIContext | ActionAPIContext,
	options = authConfig
): Promise<Session | null> {
	const config = isUserConfigLazy(options) ? await options.config(ctx) : options
	return await getSession(ctx.request, config)
}

export function isUserConfigLazy(config: UserAuthConfig) {
	return 'config' in config
}
