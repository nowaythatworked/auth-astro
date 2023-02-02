/**
 * The `node` entrypoint applies polyfills for Node 17.4.0 to 18.0.0 and exports the same API as the main entrypoint.
 * You don't need this file if you're using Node 19.0.0 or later.
 */
import crypto from 'node:crypto'

// Prior to Node 19.0.0, we need the following polyfills
// This gives us at the very least support for Node ^17.4.0
// See: https://github.com/nextauthjs/next-auth/issues/6417#issuecomment-1384660656
// @ts-ignore
if (!globalThis.crypto) globalThis.crypto = crypto
// @ts-expect-error
if (typeof globalThis.crypto.subtle === "undefined") globalThis.crypto.subtle = crypto.webcrypto.subtle
if (typeof globalThis.crypto.randomUUID === "undefined") globalThis.crypto.randomUUID = crypto.randomUUID

export * from './'
