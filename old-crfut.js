

/*

This file exists as an archive of some of the other crap I tried to get
this working. It is not neccessary to application function. I'm just
keeping it because it's a waste to throw out all of that hard work, right?

:)

*/

// The switches all have some bespoke path in their URL. For example,
// one of our switches, when you log in, takes you to:
// http://10.1.0.203/csb6ce4e37/home.htm
// We need to figure out the csb6ce4e37 bit for ... some reason?
// But we probably don't actually need to anymore, since the chromium
// clicker arounder thing shouldn't care about this.
function getAddressBaseName(host, callback) {
	console.log(`Resolving the web interface path ${host}`)
	request({
		method: 'GET',
		uri: `http://${host}/`,
	}, function(err, res, body) {
		if (err) { throw `Failed to get base name - ${err}`; }
		callback && callback(res.headers.location.replace(/\/$/, ''))
	})
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
