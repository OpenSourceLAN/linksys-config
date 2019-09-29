
var puppeteer = require('puppeteer');

var headless = module.exports = function(address, user, pass, options, callback) {
	console.log(`Clicking around on ${address}`);

	var that = this;

	this.launchBrowser().then(async browser => {
		that.browser = browser;

		that.page = await that.launchPage(browser, address);
		await that.login(that.page, user, pass);
		await that.launchMaintenacePage(that.page);
		await that.launchFileManagement(that.page);

		if (options.firmwarePath) {
			await that.launchFirmwarePage(that.page);
			await that.uploadFirmware(that.page, options.firmwarePath);
		}
		if (options.configPath) {
			await that.launchConfigUploadPage(that.page);
			await that.uploadConfiguration(that.page, options.configPath);	
		}
		await that.launchCopyFile(that.page);

		callback && callback();
	})
	.catch(function(e) {console.log(e)});


}

var getiFrame = headless.prototype.getiFrame = async(page, iFrameName) => {
	console.log(`Getting iframe named ${iFrameName}`);
	//await page.waitForSelector(`#${iFrameName}`, {visible: true});
	var frames  = page.frames().filter(frame => { console.log(frame.name()); return frame.name() == iFrameName});
	console.log("Found " + frames.length + " frames"); // should always be 0
	return frames[0];

}

headless.prototype.launchFirmwarePage = async(page) => {
	var selector = 'tr[id="2070~2160"] > td > a:last';

	await page.evaluate(() => {
		$(selector).click();
		return Promise.resolve()
	})
	await waitUntilIdle(page);
}

headless.prototype.uploadFirmware = async(page, firmwarePath) => {
	var formSelector = "#dlData";
	console.log("waiting for frame");
	await page.waitForSelector(formSelector, {visible: true});
	console.log("iframe visible");
	await waitUntilIdle(page);

	
	var frames  = page.frames().filter(frame => { console.log(frame.name()); return frame.name() == "dlData"});
	console.log("Found " + frames.length + " frames");
	var popupFrame = frames[0];

	var fileSelector = "#srcFileName";
	await popupFrame.waitForSelector(fileSelector, {visible: true});
	var uploadInput = await popupFrame.$(selector);
	await uploadInput.uploadFile(firmwarePath);
	var submit = await popupFrame.$("#defaultButton");
	await submit.click();
	await waitUntilIdle(page);
	await clickOkOnDialog(page);
}


headless.prototype.launchConfigUploadPage = async(page) => {
	await page.evaluate(() => {
		$('tr[id="2070~2180"] > td > a:last').click();
		return Promise.resolve()
	})
	await waitUntilIdle(page);
}

headless.prototype.uploadConfiguration = async(page, path) => {
	var frame = await getiFrame(page, "mainFrame");
	var httpframe = await getiFrame(page, "httpData");

	var uploadFileNameButtonSelector = "#srcFileName";
	var applyButtonSelector = "#defaultButton"
	await httpframe.waitForSelector(uploadFileNameButtonSelector, {visible: true});

	var fileInput = await httpframe.$(uploadFileNameButtonSelector);
	var applyButton = await frame.$(applyButtonSelector);

	await fileInput.uploadFile(path);
	await applyButton.click();
	await clickOkOnDialog(page);
	await waitUntilIdle(page);

}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
  }

async function waitUntilIdle(page) {
	//await sleep (5000);
	 await page.waitForNavigation({
	 	waitUntil: "networkidle2",
	 })
}

var browser = null
headless.prototype.launchBrowser = async () =>  {
	if (browser == null) {
		browser =puppeteer.launch({headless: false}); 
	}
	return await browser
}

headless.prototype.launchPage = async (browser, address) => {
	console.log("Launching browser page", address);
	var page = await browser.newPage();
	await page.goto(address, {waitUntil: 'networkidle2'})
	return page;
}

headless.prototype.login = async(page, user, pass) => {
	await page.waitForSelector("input[name=userName]", {visible: true})
	console.log(`Logging in as user ${user}`)
	var userBox = await page.$("input[name=userName]")
	await userBox.focus()
	await page.keyboard.type(user);
	var passBox = await page.$("#password");
	await passBox.focus();
	await page.keyboard.type(pass);
	var loginBox = await page.$("#btnLogin");
	await loginBox.click();
	await waitUntilIdle(page);
}

headless.prototype.launchMaintenacePage = async(page) => {
	await waitUntilIdle(page);
	console.log("clickyclicky on maintenance page link");
	var link = await page.$("#maintenancePage");
	await link.click();
	await waitUntilIdle(page);
}

headless.prototype.launchFileManagement = async(page) => {
		await waitUntilIdle(page);

	// !!! I bet this ID changes between firmawre versions !!!
	var linkId = "[id='2070'] > td > table"
	await page.waitForSelector(linkId)
	var link = await page.$(linkId);
	console.log("clickyclicky on file upload page");
	await waitUntilIdle(page);

	await link.click();
	await waitUntilIdle(page);
	// await link.click();
	// await waitUntilIdle(page);
	console.log("done");
}

headless.prototype.launchCopyFile = async(page) => {
	await waitUntilIdle(page);

	// !!! I bet this ID changes between firmawre versions !!!
	var linkId = "[id='2070~2200'] > td > table"
	await page.waitForSelector(linkId)
	var link = await page.$(linkId);
	console.log("clickyclicky on file upload page");
	await waitUntilIdle(page);

	await link.click();
	await waitUntilIdle(page);
	// await link.click();
	// await waitUntilIdle(page);
	console.log("done");
}

// unused
headless.prototype.clickCopyFIle = async(page) => {
	var frame = await getiFrame(page, "mainFrame");
//	var httpframe = await getiFrame(page, "httpData");

	//var uploadFileNameButtonSelector = "#srcFileName";
	var applyButtonSelector = "#defaultButton"
	//await httpframe.waitForSelector(uploadFileNameButtonSelector, {visible: true});

	//var fileInput = await httpframe.$(uploadFileNameButtonSelector);
	var applyButton = await frame.$(applyButtonSelector);

	//await fileInput.uploadFile(path);
	await applyButton.click();
	await clickOkOnDialog(page);
	await waitUntilIdle(page);}

// Click the logout link, and shutdown the browser instance
headless.prototype.close = function(callback) {
	var that = this;
	that.page.$("#lblLogout").then(async (logoutLink) => {
		await logoutLink.click();

		await clickOkOnDialog(that.page);

		await waitUntilIdle(that.page);
		await that.browser.close();
		callback && callback();
	})
	.catch(function(e) {
		console.log(e);
	});
}

var clickOkOnDialog = async(page) => {
	var popupSelector = "#frameless > div.tcontent > iframe";
	await page.waitForSelector(popupSelector, {visible: true});
	await waitUntilIdle(page);

	// console.log("pop up");
	// var frames  = page.frames().filter(frame => { frame.name() == "popup_gw"});
	// var popupFrame = frames[0];
	popupFrame = await getiFrame(page, "popup_gw");

	var okButtonSelector = "#btnOk";
	await popupFrame.waitForSelector(okButtonSelector, {visible: true});

	var ok = await popupFrame.$(okButtonSelector);
	waitUntilIdle(page);
	await ok.click();
}


//<% uplink_trunk_vlans.forEach((vlan) => { %>  <%= vlan %>
//<% }) %>
