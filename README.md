# Minimal reproduction: Module Federation runtime broken on @rspack/core 2.2.x

## Bug

After upgrading `@rspack/core` / `@rspack/cli` from `2.0.6` to `2.2.8` (or `2.2.9`),
a host SPA using `ModuleFederationPlugin` from `@module-federation/enhanced` 2.9.2
crashes at runtime with:

```
consumes_loading:3 Uncaught TypeError: Cannot read properties of undefined (reading 'consumes')
    at consumes_loading:3:1
```

## Root cause

`getDefaultEntryRuntimeSource()` in `@rspack/core/dist/index.js` generates the MF
runtime as a `data:text/javascript,` module that starts with:

```js
import __module_federation_bundler_runtime__ from "<path>/webpack-bundler-runtime/dist/index.cjs";
```

The function body (from `moduleFederationDefaultRuntime.js`) references the ESM
import binding `__module_federation_bundler_runtime__`. When rspack 2.2.x transforms
this data-URL module from ESM to CJS, the SWC transform renames the import binding
to a generated name (e.g. `_Users_..._index_cjs__rspack_import_0_default`) but does
**not** update the references to `__module_federation_bundler_runtime__` in the
runtime body. As a result:

1. `__module_federation_bundler_runtime__` is `undefined` at runtime.
2. `for (const key in __module_federation_bundler_runtime__)` never iterates, so
   `runtimeRequire.federation.bundlerRuntime` is never assigned.
3. `runtimeRequire.federation.bundlerRuntime.consumes(...)` throws
   `Cannot read properties of undefined (reading 'consumes')`.

This is a regression introduced in 2.2.0 — `@rspack/core` 2.0.6 and 2.1.x work fine
(`@module-federation/rspack` 2.9.2 is developed/tested against `@rspack/core` 2.1.10).

## Versions

```
@rspack/core              2.2.8 (also reproduced on 2.2.9)
@rspack/cli               2.2.8
@module-federation/enhanced 2.9.2
@module-federation/webpack-bundler-runtime 2.9.2
node 22.x
```

## Reproduction

```bash
npm install
npm run start
# open http://localhost:3000/ — console shows:
# consumes_loading:3 Uncaught TypeError: Cannot read properties of undefined (reading 'consumes')
```

## Workaround

Downgrade to `@rspack/core` / `@rspack/cli` `2.0.6` (or `2.1.10`).

## Expected fix

The ESM import binding `__module_federation_bundler_runtime__` in the generated
data-URL module must remain accessible by its original name after the ESM→CJS
transform, or the runtime body references must be updated to use the renamed binding.
