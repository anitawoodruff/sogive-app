# sogive-app

The SoGive user app - See your impact.

Try it out: <https://app.sogive.org>

This repo contains both the Java server code and the js client code.

## Javascript: Front-End Installation

### Linux

1. Install npm, and less

2. Make a folder to hold this repo + its siblings. We'll name this winterwell, after the company that wrote the original code.

       cd ~
       mkdir winterwell
       cd winterwell

3. Clone this repo, and its sibling wwappbase.js (which contains widgets and utility code)

       git clone git@github.com:winterstein/sogive-app.git
       git clone git@github.com:good-loop/wwappbase.js.git

Note: the sogive-app repo contains some symlinks to folders in the wwappbase.js repo. Your folders should look like this:

	winterwell
		/sogive-app
		/wwappbase.js

4. Install npm packages

       cd sogive-app
       npm i

5. Compile the js and the css (and - joy! - watch for edits). 

       ./watch.sh
       
Note: This is done using `webpack` and `webpack.config.js`. The watch.sh script is a handy way of doing that during development. On the production server, we use `npm run compile`.

6. Setup a local web-server (e.g. nginx or http-server) serving the sogive-app/web folder. For example, for nginx:  
  	
	1. Install nginx (the command below is for debian-flavour Linux, eg Ubuntu or Mint)
	
  			sudo apt install nginx
  
  	2. Copy the config file to nginx. Following convention, it goes in two places, symlinked together:
	
			cd /etc/nginx/sites-available
			sudo cp ~/winterwell/sogive-app/config/local.sogive.org.nginx .
			cd ../sites-enabled
			sudo ln -s ../sites-available/local.sogive.org.nginx .
	
	3. The config file expects the sogive files to be in a "standard" place, so let's make them accessible there with a symlink:
	
			sudo ln -s ~/winterwell /home/winterwell

	4. Restart nginx
	
			sudo service nginx restart

7. Modify your `/etc/hosts` file to have `127.0.0.1 local.sogive.org`

		sudo nano /etc/hosts

Then add the line: `127.0.0.1 local.sogive.org`   
and save (Control-X to exit, and follow the prompts)

8. Test: You should be able to view your local SoGive from a browser at http://local.sogive.org. It may fail to connect with a backend server, and emit an error. But you can check the js compilation is working.

9.If you got a connection error - Edit src/js/plumbing/ServerIO.js and uncomment the line:
	`ServerIO.APIBASE = 'https://test.sogive.org';`
Your local SoGive should now connect to a test server, which has some data.

10 Celebrate as you see best. Ask Sanjay if you want a recommendation for
a high impact celebration.

### Mac OS

1. Follow steps 1 - 5 in the Linux instructions to install npm, clone the repositories and run `npm i` & `./watch.sh`.


2. Setup a local web-server (e.g. nginx or http-server) serving the sogive-app/web folder. For example, for nginx:  

	1. Install nginx
		```
		brew install nginx
		```
	
  	2. Copy the config file to nginx. Following convention, it goes in two places, symlinked together:
		```
		cd /usr/local/etc/nginx/sites-available
		sudo cp ~/winterwell/sogive-app/config/local.sogive.org.nginx .
		cd ../sites-enabled
		sudo ln -s ../sites-available/local.sogive.org.nginx .
		```
	3. The config file expects the sogive files to be in `/home/winterwell`, so open the file and change that to
	the location of your winterwell directory.
		```
		cd ../sites-available
		sudo nano local.sogive.org.nginx
		```

		Replace the path in `root /home/winterwell/sogive-app/web` to the full path of `sogive-app/web` on your Mac, e.g.
		```
		root /Users/anita/winterwell/sogive-app/web;
		```
		
		Save and exit (Ctrl-X, 'y', Enter).

	4. Modify the nginx config to include the sites-enabled directory:
		```
		cd /usr/local/etc/nginx
		sudo nano nginx.conf
		```
		
		Add the following line within the `http { }` section:

		```
		include /usr/local/etc/nginx/sites-enabled/*;
		```
		
		Save and exit (Ctrl-X, 'y', Enter).
	
	5. Restart nginx
		```
		sudo nginx -s reload
		```

4. Continue following Linux instructions from Step 7 ("Modify your `/etc/hosts` file ...")


## Java: Server Installation

Not needed for UI edits, but if you want to do backend work...

1. Install Java (e.g. via apt-get install)

2. Install ElasticSearch. June 2020: We now use version 7

3. Install Bob:

       sudo npm i -g java-bob

4. Use Bob to fetch dependency jars:

       cd ~/winterwell/sogive-app
       bob

5. Start ElasticSearch

6. Run SoGive Server -- *Running SogiveServer from inside Eclipse is probably easiest*. 
If you should want to run from the command line, it is `java -ea -cp build-lib/sogive.jar:build-lib/* org.sogive.server.SoGiveServer`

7. Some tests:
   - Test your local ElasticSearch is running: http://localhost:9200
   - Test your local java SoGiveServer is running: http://localhost:8282
   - Test nginx is routing your local java SoGiveServer: http://local.sogive.org/manifest
   - Test your local web-app: http://local.sogive.org/
   

## Running the tests

### Puppeteer tests

Jest Puppeteer tests live in `src/puppeteer-tests/__tests__` and exercise core functionality
of the website, by clicking on elements and checking that other elements appear as expected.

Most of the tests require account details in order to log in to SoGive. To supply these, create a
file called `puppeteer.credentials.js` in `../logins/sogive-app` (relative to this repository
root) containing valid account details. For example (dummy values):

	const username = 'foo@example.com';
	const password = 'password1';

	module.exports = {
		username,
		password,
	};

*Note*, most tests require an account with edit rights.

To run tests, after running `npm install` once to install test dependencies, from the root of the
repository, run:

	node runtest.js [--site local/test/prod] [--test file-name.js] [-- -t 'Test case name']

where

`--site local` runs tests against http://local.sogive.org (default if not specified)

`--site test` runs tests against https://test.sogive.org

`--site prod` runs tests against https://app.sogive.org

Additional options may be included to control how the tests are run:

- `--head` - show the browser while test is running

- `--chrome` - run tests in Chrome instead of Puppeteer's default browser (Chromium)

If running with `--head`, it can be useful to run the tests in slow motion. To do this, set
an environment variable at the start of the command:

- `SLOWMO=[integer]` - introduces [integer] ms delay on each test step

For example:

`SLOWMO=150 node runtest.js --head`


