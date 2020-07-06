# Compatibility

SimpleUser, the API framework and core libraries are published...
- as standard ES2017 using standard modules (ES2015)
- with support for tree shaking and without side effects
- but not bundled, not minified, not using .mjs file extensions

## Can you provide an ES5 UMD minified bundle?
No. There are a number of build tools available which can transform what's published to whatever single format is needed - for example, Babel and Webpack.

## Is IE11 supported (it's an old web browser)?
No. If you need to make it work in IE, you might try changing the compile target to ES5 and using an ES2017 shim. However only WebRTC based media is currently supported and as IE11 does not support WebRTC you would need to provide a custom `SessionDescriptionHandler`.

## If I download the source can I change the TypeScript build target?
Yes. But note that TypeScript [does not auto-polyfill](https://github.com/microsoft/TypeScript/issues/3101).
For example, if the compiled target output is ES5 (the `target` compiler setting) but the libraries require and utilize ES2017 features (as constrained by the `lib` compiler setting), an ES2017 polyfill would be needed to run in an environment which supports ES5 but not ES2017.
