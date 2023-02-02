# Auth Astro

Auth Astro is the Auth.js implementation for Astro by Astro´s community. 

It wraps the core Auth.js library for Astro, exposing helper methods and components to make it easy to add authentication to your app.

## Installation

Install the core Auth.js package as well as the auth-astro wrapper.

**info:** The auth-astro wrapper will not work independently, it relies on @auth/core as a dependency.

```bash
npm install auth-astro@latest @auth/core@latest
```

## Usage

Check out the [full example](https://github.com/TheOtterlord/astro-auth-example) of how to use auth-astro & the accompanying [tutorial](https://blog.otterlord.dev/post/authjs-astro), or follow the steps below to get started.

### Requirements
- Node version `>= 17.4`
- Astro config set to output mode `server`

> **Note:** If you're using Node v18 or lower, you'll need to change root imports to use the `auth-astro/node` path instead of `auth-astro`. This version polyfills the webcrypto API for Node v18 to v17.4.0.
> ```diff
> - import { AstroAuth, type AstroAuthConfig } from "auth-astro"
> + import { AstroAuth, type AstroAuthConfig } from "auth-astro/node"
> ```

### Enable SSR in Your AstroJS Project

Initialize a new Astro project and enable server-side rendering.

Enabling server-side rendering within an Astro project requires a [deployment `adapter`](https://docs.astro.build/en/guides/deploy/) to be configured.

These settings can be configured within the `astro.config.mjs` file, located in the root of your project directory.

**info** The example below use the [Node `adapter`](https://docs.astro.build/en/guides/integrations-guide/node/#overview)

```js title="astro.config.mjs"
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone | middleware'
  }),
});
```

Resources:
- [Enabling SSR in Your Project](https://docs.astro.build/en/guides/server-side-rendering/#enabling-ssr-in-your-project)
- [Adding an Adapter](https://docs.astro.build/en/guides/server-side-rendering/#adding-an-adapter)

### Setup Environment Variables

Generate an auth secret by running `openssl rand -hex 32` in a local terminal or by visiting [generate-secret.vercel.app](https://generate-secret.vercel.app/32), copy the string, then set it as the `AUTH_SECRET` environment variable describe below.

Next set the `AUTH_TRUST_HOST` environment variable to `true` for hosting providers like Cloudflare Pages or Netlify.
```sh
AUTH_SECRET=<auth-secret>
AUTH_TRUST_HOST=true
```

#### Deploying to Vercel?
Setting `AUTH_TRUST_HOST` is not needed as we also check for an active Vercel environment.

### Create an AstroAuth Endpoint

No matter which provider(s) you use, you need to create one Astro [endpoint](https://docs.astro.build/en/core-concepts/endpoints/) that handles requests. 

Depending on the provider(s) you select, you will have to provide additional app credentials as environment variables within your `.env` file.

*App Credentials should be set as environment variables, and imported using `import.meta.env`.*

```ts title=".env"
AUTH_SECRET=<auth-secret>
AUTH_TRUST_HOST=<true | false>
...
GITHUB_ID=<github-oauth-clientID>
GITHUB_SECRET=<github-oauth-clientSecret>
```

**warning** @auth/core currently has a bug, which leads to a TS error when defining providers, this error can be ignored. More info [here](https://github.com/nextauthjs/next-auth/issues/6174).
```ts title="src/pages/api/auth/[...astroauth].ts"
import { AstroAuth, type AstroAuthConfig } from "auth-astro"
import GitHub from "@auth/core/providers/github"

export const authOpts: AstroAuthConfig = {
  providers: [
    //@ts-expect-error issue https://github.com/nextauthjs/next-auth/issues/6174
    GitHub({
      clientId: import.meta.env.GITHUB_ID,
      clientSecret: import.meta.env.GITHUB_SECRET,
    }),
  ]
}

export const { get, post } = AstroAuth(authOpts)
```
Some OAuth Providers request a callback URL be submitted alongside requesting a Client ID, and Client Secret. 
The callback URL used by the [providers](https://authjs.dev/reference/core/modules/providers) must be set to the following, unless you override the `prefix` field in `authOpts`:
```
[origin]/api/auth/callback/[provider]

// example
// http://localhost:3000/api/auth/callback/github
```



## Sign in & Sign out

Astro Auth exposes two ways to sign in and out. Inline scripts and Astro Components.

### With Inline script tags

The `signIn` and `signOut` methods can be imported dynamically in an inline script.

```html
---
---
<html>
<body>
  <button id="login">Login</button>
  <button id="logout">Logout</button>

  <script>
    const { signIn, signOut } = await import("auth-astro/client")
    document.querySelector("#login").onclick = () => signIn("github")
    document.querySelector("#logout").onclick = () => signOut()
  </script>
</body>
</html>
```
### With auth-astro's Components

Alternatively, you can use the `SignIn` and `SignOut` button components provided by `auth-astro/components` importing them into your Astro [component's script](https://docs.astro.build/en/core-concepts/astro-components/#the-component-script) 

```jsx
---
import { SignIn, SignOut } from 'auth-astro/components'
---
<html>
  <body>
    ...
    <SignIn provider="github" />
    <SignOut />
    ...
  </body>
</html>
```

## Fetching the session

You can fetch the session in one of two ways. The `getSession` method can be used in the component script section to fetch the session.

### Within the component script section

```tsx title="src/pages/index.astro"
---
import { getSession } from 'auth-astro';
import { authOpts } from './api/auth/[...astroauth]';

const session = await getSession(Astro.request, authOpts)
---
{session ? (
  <p>Welcome {session.user?.name}</p>
) : (
  <p>Not logged in</p>
)}
```
### Within the Auth component

Alternatively, you can use the `Auth` component to fetch the session using a render prop.

```tsx title="src/pages/index.astro"
---
import type { Session } from '@auth/core/types';
import { Auth, Signin, Signout } from 'auth-astro/components';
import { authOpts } from './api/auth/[...astroAuth]'
---
<Auth authOpts={authOpts}>
  {(session: Session) => 
    {session ? 
      <Signin provider="github">Login</Signin>
    :
      <Signout>Logout</Signout>
    }

    <p>
      {session ? `Logged in as ${session.user?.name}` : 'Not logged in'}
    </p>
  }
</Auth>
```

## State of Project

We currently are waiting for the [PR](https://github.com/nextauthjs/next-auth/pull/6463) in the offical [next-auth](https://github.com/nextauthjs/next-auth/) repository to be merged. Once this happened this package will be deprecated. 

## Contribution
Us waiting means on the PR to be merged means, we can still add new features to the PR, so, if you miss anything feel free to open a PR or issue in this repo and we will try to add it to the official package to come.
