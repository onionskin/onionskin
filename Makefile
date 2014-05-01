all: browserify uglify

browserify:
	browserify -o dist/stash.js -s Stash src/browser.js

uglify:
	uglifyjs dist/stash.js -o dist/stash.min.js --source-map dist/stash.min.js.map

coverage:
	istanbul cover _mocha -- test/*_test.js test/*/*_test.js test/*/*/*_test.js
	cat coverage/lcov.info | CODECLIMATE_REPO_TOKEN=cb7fefa26c479bc6dd7eb8dd8fa96ca07e41dbf1e75969bbacb4cf2c5db3a45b codeclimate
