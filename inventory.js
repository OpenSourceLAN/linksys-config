
/*
 Module to load and return a list of all switch assets

 Presently, returns an array of...

 {
	"id", "mac", "serial", "model", "location", "ip", "gigabitPorts", "tenGigPorts", "hasPoe"
 }

 Location is optional field that populates the "System Location config option"

 Reads data from a google sheet with ID given argument
 Should have column headers:
 ID	Model	Serial	Mac	location IP-address	
 */

var sheets = require('./googlesheets.js');

var inventory = module.exports = function(sheet, callback) {
	sheets(sheet, (err, rows) => {
		callback(err, rows && mapSheetsToInventory(rows));
	})
}

function mapSheetsToInventory(rows) {
	stop = false;

	return (rows
		// We want to stop at the first empty row
		.filter((row) => {if (stop) return false; if (row.length == 0) { stop = true; return false;} return true;})
		.map((row) => {
			return {
				"id": row[0],
				"mac": row[3],
				"serial": row[2],
				"model": row[1],
				"location": row[4],
				"ip": row[5],
				"gigabitPorts": getGigabitPortsFromModel(row[0]),
				"tenGigPorts": getTenGigPortsFromModel(row[0]),
				"hasPoe": getPoePortsFromModel(row[0]),
			}
		})
	);
}

function getGigabitPortsFromModel(model) {
	const results = /LGS\d(\d\d)P?/.exec(model)
	return results && parseInt(results[1])
}

function getTenGigPortsFromModel(model) {
	const results = /LGS5\d\dP?/.exec(model)
	return results ? 2 : 0
}

function getPoePortsFromModel(model) {
	const results = /LGS\d\d\dP/.exec(model)
	return results ? true : false
}