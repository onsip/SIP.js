## What you need to build SIP.js

You just need to have [Node.js](http://nodejs.org/) and [Git](http://git-scm.com/). Optionally you also need [PhantomJS](http://phantomjs.org/) if you want to run test units.


### Node.js

* [Install Node.js via package manager](https://github.com/nodejs/node/wiki)
* [Install Node.js from sources](http://nodejs.org)

### Git

* [Install Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)

## How to build SIP.js

Clone a copy of the main SIP.js git repository by running:
```
$ git clone https://github.com/onsip/SIP.js.git
```

Enter the directory and install the Node.js dependencies:
```
$ cd SIP.js && npm install
```

Build and test
```
$ npm run buildAndTest
```

The compiled version of SIP.js will be available in the `lib/` folder. The bundled versions of SIP.js will be available in the `dist/` subdirectory in both flavors: normal (uncompressed)  and minified, both linted with [ESLint](https://eslint.org/). There are copies of each file with the version number in the title in that subdirectory as well.

## Development version

Run `npm run build-lib` to regenerate the `lib` folder.

## Test units

SIP.js includes test units based on [Jasmine](https://jasmine.github.io/). Test units use the `dist/sip.js` file. Run the tests as follows:
```
$ npm run commandLineTest
$ npm run browserTest

Running "jasmine:components" (jasmine) task
Testing jasmine specs via chromeHeadless
...
672 specs in 2.757s.
>> 0 failures
```

## Changes in SIP.js grammar

If you modify `src/Grammar/src/Grammar.pegjs` then you need to recompile SIP.js grammar files. For that run the following task:
```
$ npm run generate-grammar
```
