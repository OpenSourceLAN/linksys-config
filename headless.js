
var puppeteer = require('puppeteer');

var headless = module.exports = function(address, user, pass, firmwarePath, callback) {
	console.log(`Clicking around on ${address}`);

	var that = this;

	this.launchBrowser().then(async browser => {
		that.browser = browser;

		that.page = await that.launchPage(browser, address);
		await that.login(that.page, user, pass);
		await that.launchMaintenacePage(that.page);
		await that.launchFileManagement(that.page);
		if (firmwarePath) {
			await that.launchFirmwarePage(that.page);
			await that.uploadFirmware(that.page, firmwarePath);
		}
		callback && callback();
	})
	.catch(function(e) {console.log(e)});


}


headless.prototype.launchFirmwarePage = async(page) => {
	var selector = 'tr[id="2070\~2160"] > td > a:last';

	await page.evaluate(() => {
		$('tr[id="2070~2160"] > td > a:last').click();
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
	console.log("Found " + frames.length + "frames");
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

headless.prototype.uploadConfiguration = function() {

}

async function waitUntilIdle(page) {
	await page.waitForNavigation({
		waitUntil: "networkidle",
		networkIdleTimeout: 1000
	})
}

headless.prototype.launchBrowser = async () =>  {
	return await puppeteer.launch({headless: false});
}

headless.prototype.launchPage = async (browser, address) => {
	console.log("Launching browser page", address);
	var page = await browser.newPage();
	await page.goto(address, {waitUntil: 'networkidle'})
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

	console.log("pop up");
	var frames  = page.frames().filter(frame => { frame.name() == "popup_gw"});
	var popupFrame = frames[0];

	var okButtonSelector = "#btnOk";
	await popupFrame.waitForSelector(okButtonSelector, {visible: true});

	var ok = await popupFrame.$(okButtonSelector);
	waitUntilIdle(page);
	await ok.click();
}