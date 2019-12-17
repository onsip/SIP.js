# Compatibility

## ES2015 (ES6)
SimpleUser, the API framework and core libraries are compatible with ES2015 or later.

Note that TypeScript [does not auto-polyfill](https://github.com/microsoft/TypeScript/issues/3101),
so even though the compiled target output is currently ES5, the libraries require and utilize
ES2015 (ES6) features (as constrained by the `lib` compiler setting).

## ES5 Deprecated
SimpleUser, the API framework and core libraries may be ES5 compatible if used with an ES6 shim.
No attempt is currently being made to support using with an ES6 shim.

The source TypeScript is currently transpiled to an ES5 target so it may
run in an ES5 environment if an ES6 shim is provided, however it is expected
that the target may be changed to ES6 in the relatively near future and thus
eliminating any support of ES5 environments (IE11 is the notable case being left behind).
