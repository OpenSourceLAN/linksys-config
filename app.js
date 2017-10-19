
var request = require('request'),
    fs = require('fs');

config = require("./config.json");
var username = config.username,
    password = config.password,
    address  = config.address,
    config = fs.readFileSync('running-config.txt');

var jar = request.jar();

//http://172.16.0.116/csb114f712/FileMgmt/httpConfigProcess.htm?
//                   /csb114f712/FileMgmt/httpConfigProcess.htm

function doLoginRequest(base, user, pass, cb) {
	request.get(`${base}/System.xml?action=login&user=${user}&password=${pass}`, function(err, res, body) {
		cb(res.headers.sessionid.replace(";path=/",""))
	})
}



//Cookie: admin_numberOfEntriesPerPage=50; activeLangId=English; isStackableDevice=false; userStatus=ok; sessionID=UserId=192.168.88.4&1802480520&; usernme=admin; firstWelcomeBanner=false; pg=00000000000000000000000000000000000000000000000000000
//cookie: admin_numberOfEntriesPerPage=50; activeLangId=English; isStackableDevice=false; sessionID=UserId=192.168.88.4&1806249400&; userStatus=ok; usernme=admin; firstWelcomeBanner=false; pg=00000000000000000000000000000000000000000000000000000
function doConfigUpdateRequest(address, sessionId, configFileContents, callback) {

console.log(`${address}/FileMgmt/httpConfigProcess.htm`);
	request({
		method: 'POST',
		uri: `${address}/FileMgmt/httpConfigProcess.htm?`,
		jar: jar,
		// multipart: [
		// 	{
		// 		"Content-Disposition": 'form-data; name="restoreUrl"',
		// 		"body": ""
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="errorCollector"',
		// 		"body": ""
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="rlCopyFreeHistoryIndex$scalar"',
		// 		"body": "6"
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="rlCopyDestinationFileType"',
		// 		"body": "2"
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="rlCopyDestinationFileName"',
		// 		"body": ""
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="rlCopyFreeHistoryIndex"',
		// 		"body": "6"
		// 	},
		// 	{
		// 		"Content-Disposition": 'form-data; name="srcFileName"; filename="running-config.txt',
		// 		"Content-Type": "text/plain",
		// 		"body": configFileContents
		// 	}
		// ]
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
					filename: "running-config.txt",
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


function getConfigUpdateRequest(address, sessionId, callback) {



	request({
		method: 'GET',
		uri: `${address}/FileMgmt/httpConfigProcess.htm`,
		jar: jar,
		
		headers: {
			"Referer": `${address}/home.htm`,
			"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0"
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})

}

function getPortStatus(address, callback) {
	request({
		method: 'GET',
		uri: `${address}/wcd?{ports}`,
		jar: jar,
		
		headers: {
			"Referer": `${address}/home.htm`,
			"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
			"Accept": "*/*"
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})
}

function doAuthUser(address, callback) {
	request({
		method: 'GET',
		uri: `${address}/device/authenticate_user.xml`,
		jar: jar,
		
		headers: {
			"Referer": `${address}/home.htm`,
			"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
			"Accept": "*/*"
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})
}

function getCopyFiles(address, callback) {
	request({
		method: 'GET',
		uri: `${address}/device/copyFiles.xml`,
		jar: jar,
		
		headers: {
			"Referer": `${address}/home.htm`,
			"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
			"Accept": "*/*"
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})
}


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


doLoginRequest(address, username, password, function(sessionId) {
	fillJar(address, sessionId);
	console.log(sessionId);
	if (sessionId) {
		setTimeout(function() {
			//
			doAuthUser(address, function() {
				//getPortStatus(address);
				getCopyFiles(address, function() {
					getConfigUpdateRequest(address, sessionId, function() {
						setTimeout(function() {
							doConfigUpdateRequest(address, sessionId, config, function() {
								getCopyFiles(address, function() {
																doConfigUpdateRequest(address, sessionId, config, function() {

							doConfigUpdateRequest(address, sessionId, config, function() {

											getConfigUpdateRequest(address, sessionId, function() {
											});
								});
							});
															}); });
						}, 1000)
					})
				});
			})
		}, 1000)
	} else {
		console.log("Couldn't get session ID");
	}
})



