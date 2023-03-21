declare module 'auth:config' {
	const config: import('./src/config').AstroAuthConfig
	export default config
}

declare module 'auth-astro' {
	const index: import('./index').Integration
	export default index
}
