
var request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio');

config = require("./config.json");
var username = config.username,
    password = config.password,
    host = config.host,
    config = fs.readFileSync(config['config-filename']),
    baseAddress = '';

var jar = request.jar();
var requester = request.defaults({
	headers: {
//		"Referer": `${address}/home.htm`,
		"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:55.0) Gecko/20100101 Firefox/55.0",
		"Accept": "*/*",
		"Connection": "keep-alive",
		"Pragma": "no-cache",
		"Cache-Control": "no-cache"
	},
	jar: jar,
	followRedirect: false
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


function getAddressBaseName(host, callback) {
	console.log(`Resolving the web interface path ${host}`)
	requester({
		method: 'GET',
		uri: `http://${host}/`,
	}, function(err, res, body) {
		if (err) { throw `Failed to get base name - ${err}`; }
		callback && callback(res.headers.location)
	})
}


//maintenance_file_fileDownload_m.htm

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



function doAllShittyRequests(baseAddress, callback) {

	var index = 0;
	function doNextDownload() {
		if (index >= allRequests.length) {
			callback && callback();
			return;
		}

		var ourUrl = allRequests[index++];
		requester({
			method: 'GET',
			uri: `${baseAddress}${ourUrl.url}`,
			headers: {
				"Referer": `${baseAddress}${ourUrl.referer}`
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

// This block of callback hell mimmicks _almost_ exactly the set of requests that
// happen when you load the magic page in the browser. Then, at the end we submit
// the config update.
getAddressBaseName(host, function(baseAddressLocal) {
	baseAddress = baseAddressLocal;
	doLoginRequest(baseAddress, username, password, function(sessionId) {
		fillJar(baseAddress, sessionId);
		doAllShittyRequests(baseAddress, function() {
			getFormPageValues(baseAddress, function(formData) {
				submitFormPageValues(baseAddress, formData, function() {
					getFormPageValues(baseAddress, function(formData) {
						doConfigUpdateRequest(baseAddress, sessionId, config, function() {
						})
					})
				})
			});
		});
	});	
})

// This is the minimal MVP of requests that work after you click the magic page
// in the web browser.
// getAddressBaseName(host, function(baseAddressLocal) {
// 	baseAddress = baseAddressLocal;
// 	doLoginRequest(baseAddress, username, password, function(sessionId) {
// 		fillJar(baseAddress, sessionId);
// 		doConfigUpdateRequest(baseAddress, sessionId, config, function() {
// 		})
// 	});	
// })










// doLoginRequest(baseAddress, username, password, function(sessionId) {
// 	fillJar(baseAddress, sessionId);
// 	console.log(sessionId);

// 	// getFormPageValues(`${baseAddress}/FileMgmt/dlData.htm`, function() {

// 	// });
// 	// return;

// 	if (sessionId) {
// 		setTimeout(function() {
// 			//
// 			doAuthUser(baseAddress, function() {
// 				doAllShittyRequests(baseAddress, function() {
// 				getFormPageValues(baseAddress, function(formData) {
// 					submitFormPageValues(baseAddress, formData, function() {

// 				//getFormPageValues(baseAddress, function(formData) {
// 					dlDataResponse(function() {
// 				//getPortStatus(baseAddress);
// 				//getFileUploadPage(baseAddress, function() {
// //					getCopyFiles(baseAddress, function() {
// 						//getConfigUpdateRequest(baseAddress, function() {
// 							//setTimeout(function() {
// 								jar.setCookie("sessionID=", baseAddress);
// 								doLoginRequest(baseAddress, username, password, function(sessionId) {
// 	fillJar(baseAddress, sessionId);
// 								doConfigUpdateRequest(baseAddress, sessionId, config, function() {
// 								});
// 									//getCopyFiles(baseAddress, function() {
// 																	//doConfigUpdateRequest(baseAddress, sessionId, config, function() {

// 								//doConfigUpdateRequest(baseAddress, sessionId, config, function() {

// 												//getConfigUpdateRequest(baseAddress, function() {
// 												//});
// 									//});
// 								});
																
// 								})
// 																//}); });
// 							//}, 1000)
// 						})
// 					});
// 			//	});
// 			//		})
// 				})
// 				//});
// 			})
// 		}, 1000)
// 	} else {
// 		console.log("Couldn't get session ID");
// 	}
// })






var allRequests = [{
  "url": `/device/Timestamp_MIB.xml?[rlEventsMaskTableVT]Query:rlEventsMaskPollerId=5`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/device/noStamp.xml`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/device/authenticate_user.xml`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/FileMgmt/maintenance_file_fileDownload_m.htm`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/styling/styling.css`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/css/ProjectStyling.css`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/pageTokens.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/initFunctions.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/globalFunctions.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/styling/styling.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/winInWin_m.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/projectLocalization.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/js/IPFormatSelectionHost.js`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/device/blank.html`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/styling/images/red3angle_left.gif`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/FileMgmt/httpConfigProcess.htm`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/styling/images/empty.gif`,
  "type": "GET",
  "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
},
{
  "url": `/HTTPmib.xml`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/images/radio_button.png`,
  "type": "GET",
  "referer": `/css/ProjectStyling.css`
},
{
  "url": `/images/radio_button_on.png`,
  "type": "GET",
  "referer": `/css/ProjectStyling.css`
},
{
  "url": `/images/dropdownarrows.gif`,
  "type": "GET",
  "referer": `/styling/styling.css`
},
{
  "url": `/FileMgmt/HTTPmib.xml`,
  "type": "GET",
  "referer": `/home.htm`
},
{
  "url": `/styling/styling.css`,
  "type": "GET",
  "referer": `/FileMgmt/httpConfigProcess.htm`
},
{
  "url": `/css/ProjectStyling.css`,
  "type": "GET",
  "referer": `/FileMgmt/httpConfigProcess.htm`
},
{
  "url": `/styling/styling.js`,
  "type": "GET",
  "referer": `/FileMgmt/httpConfigProcess.htm`
},
{
  "url": `/js/pageTokens.js`,
  "type": "GET",
  "referer": `/FileMgmt/httpConfigProcess.htm`
},
{
  "url": `/js/projectLocalization.js`,
  "type": "GET",
  "referer": `/FileMgmt/httpConfigProcess.htm`
}
// ,
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "GET",
//   "referer": `/FileMgmt/maintenance_file_fileDownload_m.htm`
// },
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "POST",
//   "referer": `/FileMgmt/dlData.htm`
// },
// {
//   "url": `/FileMgmt/dlData.htm`,
//   "type": "GET",
//   "referer": `/FileMgmt/dlData.htm`
// }

]