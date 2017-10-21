
var request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio');

config = require("./config.json");
var username = config.username,
    password = config.password,
    address  = config.address,
    config = fs.readFileSync(config['config-filename']);

var jar = request.jar();
var requester = request.defaults({
	headers: {
		"Referer": `${address}/home.htm`,
		"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
		"Accept": "*/*",
		"Connection": "keep-alive"
	},
	jar: jar
});

//http://172.16.0.116/csb114f712/FileMgmt/httpConfigProcess.htm?
//                   /csb114f712/FileMgmt/httpConfigProcess.htm

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



//Cookie: admin_numberOfEntriesPerPage=50; activeLangId=English; isStackableDevice=false; userStatus=ok; sessionID=UserId=192.168.88.4&1802480520&; usernme=admin; firstWelcomeBanner=false; pg=00000000000000000000000000000000000000000000000000000
//cookie: admin_numberOfEntriesPerPage=50; activeLangId=English; isStackableDevice=false; sessionID=UserId=192.168.88.4&1806249400&; userStatus=ok; usernme=admin; firstWelcomeBanner=false; pg=00000000000000000000000000000000000000000000000000000
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


function basicRequest(address, callback) {
	console.log(`Requesting ${address}`)
	requester({
		method: 'GET',
		uri: address,
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})
}

// Some of linksys's requests are to pages that are just a form.
// return all inputs and their value
function getFormPageValues(address, callback) {
	requester({uri: `${address}/FileMgmt/dlData.htm`},
		function(err, res, body) {
			var results = {};
			var $ = cheerio.load(body);
			$("input").each(function() {
				var name = $(this).attr('name');
				var val = $(this).val();
				var disabled = $(this).attr('disabled');
				if (!disabled) { //&& name.indexOf("mibError") === -1) {
					results[name] = val;
				}
			})
			console.log(results);
			callback(results);
		}
	)
}

function submitFormPageValues(address, formData, callback) {
	requester({
		method: 'POST',
		uri: `${address}/FileMgmt/dlData.htm`,
		form: formData,
		headers: {
			Referer: `${address}/FileMgmt/dlData.htm`
		}
	}, function(err, res, body) {
		console.log(res.statusCode, body);
		callback && callback()
	})
}


//maintenance_file_fileDownload_m.htm

function makeRequester(path, referer) {
	return function(callback) {
		requester({
		method: 'GET',
		uri: path,
	}, function(err, res, body) {
		callback && callback()
	})
	}
}

var dlDataResponse = makeRequester(`${address}/FileMgmt/dlData.html?`, `${address}/FileMgmt/dlData.htm`);

function getConfigUpdateRequest(address, callback) {
	basicRequest(`${address}/FileMgmt/httpConfigProcess.htm`, callback)
}

function getPortStatus(address, callback) {
	basicRequest(`${address}/wcd?{ports}`, callback)
}

function doAuthUser(address, callback) {
	basicRequest(`${address}/device/authenticate_user.xml`, callback)	
}

function getCopyFiles(address, callback) {
	basicRequest(`${address}/device/copyFiles.xml`, callback)	
}

function getFileUploadPage(address, callback) {
	basicRequest(`${address}/FileMgmt/maintenance_file_fileUpload_m.htm`, callback);
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



function doAllShittyRequests(callback) {

	var index = 0;
	function doNextDownload() {
		if (index >= allRequests.length) {
			callback && callback();
			return;
		}

		var ourUrl = allRequests[index++];
		requester({
			method: 'GET',
			uri: ourUrl.url,
			headers: {
				"Referer": ourUrl.referer
			}
		}, function(err, res, body) {
			if (err) {
				console.log(`Error reading ${ourUrl.url} - ${err}`);
			} else {
				console.log(`Got ${ourUrl.url} with result ${res.statusCode}`);
			}
			doNextDownload();
		})	
	}
	doNextDownload();
}

doLoginRequest(address, username, password, function(sessionId) {
	fillJar(address, sessionId);
	doConfigUpdateRequest(address, sessionId, config, function() {
	});
});
return;
doLoginRequest(address, username, password, function(sessionId) {
	fillJar(address, sessionId);
	console.log(sessionId);

	// getFormPageValues(`${address}/FileMgmt/dlData.htm`, function() {

	// });
	// return;

	if (sessionId) {
		setTimeout(function() {
			//
			doAuthUser(address, function() {
				doAllShittyRequests(function() {
				getFormPageValues(address, function(formData) {
					submitFormPageValues(address, formData, function() {

				//getFormPageValues(address, function(formData) {
					dlDataResponse(function() {
				//getPortStatus(address);
				//getFileUploadPage(address, function() {
//					getCopyFiles(address, function() {
						//getConfigUpdateRequest(address, function() {
							//setTimeout(function() {
								jar.setCookie("sessionID=", address);
								doLoginRequest(address, username, password, function(sessionId) {
	fillJar(address, sessionId);
								doConfigUpdateRequest(address, sessionId, config, function() {
								});
									//getCopyFiles(address, function() {
																	//doConfigUpdateRequest(address, sessionId, config, function() {

								//doConfigUpdateRequest(address, sessionId, config, function() {

												//getConfigUpdateRequest(address, function() {
												//});
									//});
								});
																
								})
																//}); });
							//}, 1000)
						})
					});
			//	});
			//		})
				})
				//});
			})
		}, 1000)
	} else {
		console.log("Couldn't get session ID");
	}
})






var allRequests = [{
  "url": "http://192.168.1.251/csb114f712/device/Timestamp_MIB.xml?[rlEventsMaskTableVT]Query:rlEventsMaskPollerId=5",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/device/noStamp.xml",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/device/authenticate_user.xml",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/styling.css",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/css/ProjectStyling.css",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/pageTokens.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/initFunctions.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/globalFunctions.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/styling.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/winInWin_m.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/projectLocalization.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/IPFormatSelectionHost.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/device/blank.html",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/images/red3angle_left.gif",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/images/empty.gif",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
},
{
  "url": "http://192.168.1.251/FileMgmt/HTTPmib.xml",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/images/radio_button.png",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/css/ProjectStyling.css"
},
{
  "url": "http://192.168.1.251/csb114f712/images/radio_button_on.png",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/css/ProjectStyling.css"
},
{
  "url": "http://192.168.1.251/csb114f712/images/dropdownarrows.gif",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/styling/styling.css"
},
{
  "url": "http://192.168.1.251/csb114f712/FileMgmt/HTTPmib.xml",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/home.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/styling.css",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/css/ProjectStyling.css",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/styling/styling.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/pageTokens.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm"
},
{
  "url": "http://192.168.1.251/csb114f712/js/projectLocalization.js",
  "type": "GET",
  "referer": "http://192.168.1.251/csb114f712/FileMgmt/httpConfigProcess.htm"
}
//,
// {
//   "url": "http://192.168.1.251/csb114f712/FileMgmt/dlData.htm",
//   "type": "GET",
//   "referer": "http://192.168.1.251/csb114f712/FileMgmt/maintenance_file_fileDownload_m.htm"
// },
// {
//   "url": "http://192.168.1.251/csb114f712/FileMgmt/dlData.htm",
//   "type": "POST",
//   "referer": "http://192.168.1.251/csb114f712/FileMgmt/dlData.htm"
// },
// {
//   "url": "http://192.168.1.251/csb114f712/FileMgmt/dlData.htm?",
//   "type": "GET",
//   "referer": "http://192.168.1.251/csb114f712/FileMgmt/dlData.htm"
// }
]