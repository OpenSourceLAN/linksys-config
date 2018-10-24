
var fs = require('fs'),
    _ = require('underscore');

var basic_defaults = {
	location: "\"\"",
	snmppassword: "\"\"",
	num_ten_gig_ports: 0,
	num_gigabit_ports: 18, // smallest switch we have
	uplink_trunk_vlans: [11,16,17,18,20,21,22,23,24],
        split_mac_address: function(mac) {
          bytes = mac.split("")
          output = []
          while (bytes.length > 0) {
            output.push(bytes.shift() +  bytes.shift())
          }
          return output.join(":");
        }
}

var templater = module.exports = function(templateName, defaults = {}) {
	this.template = _.template(fs.readFileSync(templateName).toString());
	this.defaults = defaults;
}

templater.prototype.resolveOptions = function resolveOptions(overrides) {
	var output = {};
	Object.assign(output, basic_defaults, this.defaults, overrides)
	return output;
}

templater.prototype.getTemplateFor = function getTemplateFor(device) {
	var device = this.resolveOptions(device);
	//console.log(device);
	return this.template(device);

}
