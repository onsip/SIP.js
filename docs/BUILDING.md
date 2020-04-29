## What you need to build SIP.js

You just need to have [Node.js](http://nodejs.org/) and [Git](http://git-scm.com/).

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
$ cd SIP.js
$ npm install
```

Build and test
```
$ npm run buildAndTest
```

The compiled version of SIP.js will be available in the `lib/` folder. The bundled versions of SIP.js will be available in the `dist/` subdirectory in both flavors. There are copies of each file with the version number in the title in that subdirectory as well.

## Development 

Run `npm run build-lib` to regenerate the `lib` folder.

## Tests

SIP.js includes integration and units implemented using [Jasmine](https://jasmine.github.io/).
Run the tests as follows:
```
$ npm run commandLineTest
```
or
```
$ npm run browserTest
```

## Changes in SIP.js grammar

If you modify `src/grammar/src/grammar.pegjs` you will need to recompile SIP.js grammar files.
For that run the following task:
```
$ npm run generate-grammar
```
