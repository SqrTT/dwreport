NODE = nodejs
NODEMON = $(NODE) ./node_modules/nodemon/bin/nodemon.js
MOCHA = $(NODE) ./node_modules/.bin/mocha
INSPECTOR = $(NODE) ./node_modules/node-inspector/bin/inspector.js
STARTFILE = ./src/server.js

test:
	@NODE_ENV=test $(MOCHA) \
		-r chai \
		--check-leaks \
		-R spec

run:
	@NODE_ENV=run $(NODEMON) $(STARTFILE)

profile:
	@NODE_ENV=profile $(NODEMON) $(STARTFILE)

debug:
	@NODE_ENV=debug $(NODEMON) --debug $(STARTFILE) &\
		$(INSPECTOR)

test-cov: core-cov
	@COVERAGE=1 $(MOCHA) \
		-r chai \
		--check-leaks \
		-R html-cov > coverage.html

core-cov: clear
	@jscoverage --encoding=utf8 --no-highlight core core-cov

clear:
	@rm -rf core-cov coverage.html


.PHONY: test test-cov clear run debug profile

