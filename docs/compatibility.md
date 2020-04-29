# Compatibility

## ES2015 (ES6)
SimpleUser, the API framework and core libraries are compatible with ES2015 or later.

## Polyfills Required - none
No polyfills are needed. The libraries only use features from ES2015 and below.

Note that TypeScript [does not auto-polyfill](https://github.com/microsoft/TypeScript/issues/3101).
For example, if the compiled target output is ES2015 (the `target` compiler setting) but the libraries require and utilize ES2017 features (as constrained by the `lib` compiler setting), an ES2017 polyfill would be needed to run in an environment which supports ES2015 but not ES2017.

## IE11 (it's an old web browser) - not supported
If you need to make it work in IE, you might try changing the compile target to ES5 and use an ES6 shim.
No attempt is currently being made to support using with an ES6 shim.
So again, not supported.
