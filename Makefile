all: browserify uglify

browserify:
	browserify -o dist/onionskin.js src/browser.js -r bluebird -r ./src/browser.js:onionskin

uglify:
	uglifyjs dist/onionskin.js -o dist/onionskin.min.js --source-map dist/onionskin.min.map

coverage:
	istanbul cover _mocha -- test/*_test.js test/*/*_test.js test/*/*/*_test.js
	cat coverage/lcov.info | codeclimate
