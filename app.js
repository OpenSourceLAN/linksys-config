
var request = require('request'),
    fs = require('fs'),
    cheerio = require('cheerio'),
    process = require('process'),
    fs = require('fs'),
    inventory = require('./inventory.js'),
    async = require('async'),
    headless = require ('./headless.js');

config = require('./config.json');
var username = config.username,
    password = config.password,
    config_directory = config['generated_config_directory'];

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  console.log(reason.stack);
});

// We'll write all of our generated configs out to this folder
if (!fs.existsSync(config_directory)) fs.mkdirSync(config_directory);

function getModelsToUpdateFromCommandLine(inventoryList) {
	// remove `node app.js` from arvg
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

var theTemplater = require('./templater.js');
var templater = new theTemplater('switch-config-template.underscore', {snmppassword: password});
function getTemplateForDevice(device) {
	var path = `${config_directory}/${device['id']}.txt`;
	var template = templater.getTemplateFor(device);
	fs.writeFileSync(path, template);
	return path;
}

function getListOfFunctionsToRun(inventoryList) {
	return inventoryList.map((inv) => function(callback) {
		processInventoryItem(inv, callback);
	})
}

// Process an individual switch, including config generation and uploading
function processInventoryItem(inv, callback) {

	// TODO:
	// * Generate template file
	// * Get the base address for this switch model
	// * Create Chromium session
	// * Upload config file

	console.log(`processing ${inv['id']}`);

	let confPath = getTemplateForDevice(inv);

	var baseAddressLocal= `http://${inv['ip']}/`;
	var options = {
		configPath: confPath
	}
	var h = new headless(baseAddressLocal, username, password, options, function() {
		//h.close(); // this closes the chrome window upon completion
		callback(null);
	});
}

// Get list of all inventory items, and trigger processing on them
inventory(config['google_spreadsheet_id'], (err, inventoryList) => {
	const targets = getModelsToUpdateFromCommandLine(inventoryList);

	async.parallelLimit(getListOfFunctionsToRun(targets), 10, (err, res) => {
		console.log(`Done with err: ${err} and result ${res} `)
	})
})