# How To version release SIP.js

(These are developer notes.)

(These may not be entirely accurate.)

(Eric Green demands credit for these.)

(So remember that if it's broken, you know who to contact.)

(If you don't know, it's Eric Green.)

1. On your own github, checkout last tagged release on a new branch
2. remove all dist files
3. cherry pick commits you want using -x flag (for "hot patch" releases)
4. once ready, test.
5. update version number on master
6. cherry pick version number commit to new branch
7. build and test.
8. test again
9. add new dist files (git add -f if it complains)
10. test npm and bower (bower might require push to local github)
11. push to local github
12. merge
13. git tag (your version number)
14. git push --tags
15. get a clean release
16. npm publish
17. do release notes on github and release!
18. update website