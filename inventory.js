
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
			var access_vlan = parseInt(row[6]);
			access_vlan = isNaN(access_vlan) ? 20 : access_vlan;
			gigPorts = getGigabitPortsFromModel(row[1]);
			tenGigPorts = getTenGigPortsFromModel(row[1]);

			// On all of our managed switches, we reserve the last two gigabit
			// ports for uplinks. On our 10 Gigabit switches, these are still
			// reserved for non-access-port uses.
			access_ports = gigPorts - 2;

			return {
				"id": row[0],
				"mac": row[3],
				"serial": row[2],
				"model": row[1],
				"location": row[4],
				"hostname": row[0],
				"ip": row[5],
				"num_gigabit_ports": gigPorts,
				"num_ten_gig_ports": tenGigPorts,
				"has_poe": getPoePortsFromModel(row[0]),
				"access_vlan": access_vlan,
				"num_access_ports": access_ports,
				"num_trunk_ports": 2, // always want two uplink ports
			}
		})
	);
}

function getGigabitPortsFromModel(model) {
	// The LGS552 includes the 2 TenGigabit ports in its port count of 52, but
	// actually there's only 50 gigabit ports.
	const results = /LGS\d(\d\d)P?/.exec(model)
	const tenGigPorts = getTenGigPortsFromModel(model);
	return results && (parseInt(results[1]) - tenGigPorts);
}

function getTenGigPortsFromModel(model) {
	const results = /LGS5\d\dP?/.exec(model)
	return results ? 2 : 0
}

function getPoePortsFromModel(model) {
	const results = /LGS\d\d\dP/.exec(model)
	return results ? true : false
}