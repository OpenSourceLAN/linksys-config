
var puppeteer = require('puppeteer');

var headless = module.exports = function(address, user, pass, callback) {
	console.log(`Clicking around on ${address}`);

	var that = this;

	this.launchBrowser().then(async browser => {
		that.browser = browser;

		that.page = await that.launchPage(browser, address);
		await that.login(that.page, user, pass);
		await that.launchMaintenacePage(that.page);
		await that.launchFileManagement(that.page);

		callback && callback();
	})
	.catch(function(e) {console.log(e)});


}

async function waitUntilIdle(page) {
	await page.waitForNavigation({
		waitUntil: "networkidle",
		networkIdleTimeout: 1000
	})
}

headless.prototype.launchBrowser = async () =>  {
	return await puppeteer.launch({headless: true});
}

headless.prototype.launchPage = async (browser, address) => {
	console.log("Launching browser page", address);
	var page = await browser.newPage();
	await page.goto(address, {waitUntil: 'networkidle'})
	return page;
}

headless.prototype.login = async(page, user, pass) => {
	await page.waitForSelector("input[name=userName]")
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
	console.log("clickyclicky on maintenance page link");
	var link = await page.$("#maintenancePage");
	await link.click();
	await waitUntilIdle(page);
}

headless.prototype.launchFileManagement = async(page) => {
	// !!! I bet this ID changes between firmawre versions !!!
	var linkId = "[id='2070'] > td > table"
	await page.waitForSelector(linkId)
	var link = await page.$(linkId);
	console.log("clickyclicky on file upload page");
	await link.click();
	await waitUntilIdle(page);
	await link.click();
	await waitUntilIdle(page);
}

// Click the logout link, and shutdown the browser instance
headless.prototype.close = function(callback) {
	var that = this;
	that.page.$("#lblLogout").then(async (logoutLink) => {
		await logoutLink.click();
		var popupSelector = "#frameless > div.tcontent > iframe";
		await that.page.waitForSelector(popupSelector);
		await waitUntilIdle(that.page);

		console.log("pop up");
		var frames  = that.page.frames().filter(frame => { frame.name() == "popup_gw"});
		var popupFrame = frames[0];

		var okButtonSelector = "#btnOk";
		await popupFrame.waitForSelector(okButtonSelector, {visible: true});

		var ok = await popupFrame.$(okButtonSelector);
		waitUntilIdle(that.page);
		await ok.click();

		await waitUntilIdle(that.page);
		await that.browser.close();
		callback && callback();
	})
	.catch(function(e) {
		console.log(e);
	});
}