# How To version release SIP.js

* On your own github, checkout last tagged release on a new branch (note: this can be done on the repo's release branch, instead of making your own)
* remove all dist files
* cherry pick commits you want using -x flag (for "hot patch" releases)
* once ready, test.
* on master, npm version <major,minor,patch> --git-tag-version false
* DO NOT MANUALLY UPDATE THE VERSION. We now hardcode it in the library, using npm version will update it appropriately
* cherry pick version number commit to new branch (or just merge master, if you want everything)
* build and test.
* test again
* add new dist files (git add -f if it complains)
* commit

* push to local github
* merge (this step and the above one can be skipped if you just do it on the the repo's release branch itself)
* git tag (your version number)
* git push --tags
* get a clean release (as in, fresh clone)
* npm publish
* do release notes on github and release!
* update website
