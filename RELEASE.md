# How To version release SIP.js

(These are developer notes.)

(These may not be entirely accurate.)

(Eric Green demands credit for these.)

(So remember that if it's broken, you know who to contact.)

(If you don't know, it's Eric Green.)

* On your own github, checkout last tagged release on a new branch
* remove all dist files
* cherry pick commits you want using -x flag (for "hot patch" releases)
* once ready, test.
* update version number on master
* cherry pick version number commit to new branch
* build and test.
* test again
* add new dist files (git add -f if it complains)
* test npm:

    ```shell
    #!/usr/bin/env bash
    set -e
    SIPJS_DIR=`pwd`

    cd /tmp
    rm -rf node_modules
    npm install $SIPJS_DIR

    node -e "var SIP = require('sip.js'); new SIP.UA({traceSip: true}); setTimeout(process.exit, 2000)"
    cd node_modules/sip.js && npm install && npm test

    SIPJS_TEST="var SIP = require('sip.js'); var session = new SIP.UA({traceSip: true}).invite('welcome@onsip.com', new Audio());"
    SIPJS_TEST+="session.on('accepted', setTimeout.bind(null, window.close, 5000))"
    npm install -g browserify smokestack
    browserify -r sip.js | cat - <(echo $SIPJS_TEST) | smokestack

    # more tests

    cd $SIPJS_DIR
    set +e
    ```

* test bower:

    ```shell
    #!/usr/bin/env bash
    set -e
    SIPJS_DIR=`pwd`
    SIPJS_HASH=`git rev-parse HEAD`

    cd /tmp
    rm -rf bower_components
    bower install "$SIPJS_DIR/.git#$SIPJS_HASH"

    SIPJS_TEST="var session = new SIP.UA({traceSip: true}).invite('welcome@onsip.com', new Audio());"
    SIPJS_TEST+="session.on('accepted', setTimeout.bind(null, window.close, 5000))"
    npm install -g smokestack
    cat ./bower_components/sip.js/dist/sip.min.js <(echo $SIPJS_TEST) | smokestack

    # more tests

    cd $SIPJS_DIR
    set +e
    ```

* push to local github
* merge
* git tag (your version number)
* git push --tags
* get a clean release
* npm publish
* do release notes on github and release!
* update website
