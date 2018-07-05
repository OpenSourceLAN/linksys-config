
var request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    process = require('process'),
    fs = require('fs'),
    inventory = require('./inventory.js'),
    async = require('async'),
    headless = require ('./headless.js');;

configname = process.argv[process.argv.length -1];

if (process.argv.length <= 2 || fs.existsSync(configname) == false) 
	configname = "./config.json";

config = require(configname);
console.log(config);
console.log(configname);
console.log(process.argv);
var username = config.username,
    password = config.password,
    host = config.host,
    config = fs.readFileSync(config['config-filename']),
    baseAddress = '';

var jar = request.jar();
var requester = request.defaults({
	headers: {
		"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
		"Accept": "*/*",
		"Connection": "keep-alive",
		"Pragma": "no-cache",
		"Cache-Control": "no-cache"
	},
	jar: jar,
	followRedirect: false
});

function doLoginRequest(base, user, pass, cb) {
	requester.get(`${base}/System.xml?action=login&user=${user}&password=${pass}`, function(err, res, body) {
		console.log(res.headers)
		if (!res.headers.sessionid) {
			console.log(body);
			throw "No session ID cookie returned";
		}
		cb(res.headers.sessionid.replace(";path=/",""))
	})
}

function doConfigUpdateRequest(address, sessionId, configFileContents, callback) {

	console.log(`${address}/FileMgmt/httpConfigProcess.htm`);
	request({
		method: 'POST',
		uri: `${address}/FileMgmt/httpConfigProcess.htm?`,
		jar: jar,
		formData: {
			restoreUrl: "",
			errorCollector: "",
			"rlCopyFreeHistoryIndex$scalar": "5",
			rlCopyDestinationFileType: "2",
			rlCopyDestinationFileName: "",
			"rlCopyFreeHistoryIndex": "5",
			srcFileName: {
				value: configFileContents,
				options: {
					filename: `running-config-${ Math.floor(Math.random()*100000).toString() }.txt`,
					contentType: "text/plain"
				}
			}
		},
		headers: {
			"Referer": `${address}/home.htm`,
			"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
			"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})

}

function getAddressBaseName(host, callback) {
	console.log(`Resolving the web interface path ${host}`)
	requester({
		method: 'GET',
		uri: `http://${host}/`,
	}, function(err, res, body) {
		if (err) { throw `Failed to get base name - ${err}`; }
		callback && callback(res.headers.location.replace(/\/$/, ''))
	})
}

function makeRequester(path, referer) {
	if (referer) referer = `${baseAddress}${referer}`;
	return function(callback) {
		requester({
		method: 'GET',
		uri: `${baseAddress}${path}`,
		headers: {
			Referer: referer
		}
	}, function(err, res, body) {
		callback && callback()
	})
	}
}

var dlDataResponse = makeRequester(`/FileMgmt/dlData.html?`, `/FileMgmt/dlData.htm`);
var logout = makeRequester(`/config/log_off_page.html`);

function fillJar(address, sessionId) {
	var sessionCookie = request.cookie(`sessionID=${sessionId}`);
	jar.setCookie(request.cookie('admin_numberOfEntriesPerPage=50'), address);
	jar.setCookie(request.cookie('activeLangId=English'), address);
	jar.setCookie(request.cookie('isStackableDevice=false'), address);
	jar.setCookie(request.cookie('userStatus=ok'), address);
	jar.setCookie(sessionCookie, address);
	jar.setCookie(request.cookie('usernme=admin'), address);
	jar.setCookie(request.cookie('firstWelcomeBanner=false'), address);
	jar.setCookie(request.cookie('pg=00000000000000000000000000000000000000000000000000000'), address);
}

function doConfigurationUpload(callback) {
	jar.setCookie("sessionID=", baseAddress);
	doLoginRequest(baseAddress, username, password, function(sessionId) {
		fillJar(baseAddress, sessionId);
		doConfigUpdateRequest(baseAddress, sessionId, config, function() {
			logout(function() {
				callback && callback();
			})
		})
	});	
}

// Launch a Chromium headless window, to browse to the magic page
// then upload config, and then close Chrome again.
// getAddressBaseName(host, function(baseAddressLocal) {
// 	console.log(baseAddressLocal);
// 	baseAddress = baseAddressLocal;
// 	var h = new headless(baseAddressLocal, username, password, null, function() { //"/home/sirsquidness/respawn/pax/linksys/LGS500-11027.ros"
// 		doConfigurationUpload(function() {
// 			h.close();
// 		});
// 	});
// });


function getModelsToUpdateFromCommandLine(inventoryList) {
	// remove node script.js from arvg
	args = process.argv.slice(2).map((arg) => arg.toLowerCase());
	if (args.length == 0) {
		console.log("No switches given. List individual switch IDs as arguments, or just 'all'")
		process.exit(1);
	}
	if (args.length == 1 && args[0].toLowerCase() == "all") {
		return inventoryList;
	}
	return inventoryList.filter((inv) => {
		return args.indexOf(inv['id'].toLowerCase()) !== -1
	})
}

function getListOfFunctionsToRun(inventoryList) {
	return inventoryList.map((inv) => function(callback) {
		processInventoryItem(inv, callback);
	})
}

function processInventoryItem(inv, callback) {

	// TODO:
	// * Get the base address for this switch model
	// * Generate template file
	// * Create Chromium session
	// * Upload config file

	console.log(`processing ${inv['id']}`);

	getAddressBaseName(inv['ip'], function(baseAddressLocal) {
		console.log(`switch ${inv['id']} has base address ${baseAddressLocal}`);
		var h = new headless(baseAddressLocal, username, password, null, function() {
			callback(null);
		});
	});
}

inventory('1P_nDaT90eXK1NSvxhWaYdM42Llw0pqYmoH3xQF7ZVgQ', (err, inventoryList) => {
	const targets = getModelsToUpdateFromCommandLine(inventoryList);

	async.parallelLimit(getListOfFunctionsToRun(targets), 10, (err, res) => {
		console.log(`Done with err: ${err} and result ${res} `)
	})

})