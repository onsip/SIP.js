## What you need to build SIP.js

You just need to have [Node.js](http://nodejs.org/) and [Git](http://git-scm.com/). Optionally you also need [PhantomJS](http://phantomjs.org/) if you want to run test units.


### Node.js

* [Install Node.js via package manager](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager)
* [Install Node.js from sources](http://nodejs.org)

### Git

* [Install Git](http://git-scm.com/book/en/Getting-Started-Installing-Git)


### PhantomJS

(optional, just for running unit tests)

* [Install PhantomJS](http://phantomjs.org/download.html)
* In modern Debian/Ubuntu systems PhantomJS can be installed via `apt-get install phantomjs`


## How to build SIP.js

Clone a copy of the main SIP.js git repository by running:
```
$ git clone https://github.com/onsip/SIP.js.git
```

Install grunt-cli globally:
```
$ npm install -g grunt-cli
```

Enter the directory and install the Node.js dependencies:
```
$ cd SIP.js && npm install
```

Make sure you have `grunt` installed by testing:
```
$ grunt -version
```

Finally, run `grunt` command with no arguments to get a complete version of SIP.js:
```
$ grunt
```

The built version of SIP.js will be available in the `dist/` subdirectory in both flavors: normal (uncompressed)  and minified, both linted with [JSLint](http://jslint.com/). There will be also a file named `dist/sip-devel.js` which is an exact copy of the uncompressed file.


## Development version

Run `grunt devel` for just generating the `dist/sip-devel.js` file. An uncompressed SIP.js source file named `sip-devel.js` will be created in `dist` directory.


## Test units

SIP.js includes test units based on [Jasmine](http://pivotal.github.io/jasmine/). Test units use the `dist/sip-devel.js` file. Run the tests as follows:
```
$ grunt test

Running "jasmine:components" (jasmine) task
Testing jasmine specs via phantom
...
672 specs in 2.757s.
>> 0 failures
```

## Changes in SIP.js grammar

If you modify `src/Grammar/src/Grammar.pegjs` then you need to recompile SIP.js grammar files. For that run the following task:
```
$ grunt grammar
```
And then build SIP.js again as explained above.
