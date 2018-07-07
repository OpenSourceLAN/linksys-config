
# Linksys config

A tool to upload configs to Linksys switches so you don't have to use the web interface.


The original approach was to use HTTP requests from inside Node to mimmick
the file upload process, but there's some magic in the process that makes
this painful - the requests from Node will not work unless an interactive
browser session has recently visited the file upload page (sounds stupid
right? Yeah.).

So now the script spins up a headless Chrome instance via puppeteer, then
browses to the magic page before doing an upload.

I've left all of the old methods I had while trying to get the system to
work without headless Chrome in `cruft.js` and `old-crust.js`, just in case they're useful
in the future. :)

### Compatibility

Tested with a Linksys LGS326 (firmare v1.1.0.21) and LGS552 (firmare
v1.1.0.27)

### Usage

Set up a `client_secret.json` file using the instructions on [this page](https://developers.google.com/sheets/api/quickstart/nodejs)

Alternatively, you can edit `inventory.js` to pull from a local file or other source instead.


Make a config.json file like this:

```
{
"username": "admin",
"password": "admin",
"generated_config_directory": "./config/",
"google_spreadsheet_id": "the_id_of_your_google_spreadsheet_here"
}
```

The `google_spreadsheet_id` should be the ID of a spreadsheet that has a format like this:

```
ID	Model	Serial	Mac	LogicalName	IP	DefaultVLAN
SW-X52-01	LGS552	14F10C96xxxxxx	B4750Exxxxxx	server1	10.1.0.11	11
```

`LogicalName` populates the Location field, and (TODO) we use this field to generate
a switch DNS zone file, so we can move switches around and update the location mapping
without having to fiddle with their IP addresses.

`ID` is an arbitrary value unique to each switch, which you use on the command line to
identify which switches to update.

Run `npm install && node app.js`

Run the application with either of:

```
node app.js all # config all switches
node app.js SW-X52-01 SW-X52-02 #  ... etc. Specify individual switches to update
```

**Warning** it currently does not do a `copy run start` - so rebooting switches
_currently_ loses config. This will be fixed "shortly".

### TODO

* Do a `copy run start` after uploading config
* Option to update firmware
* Do all updates in different tabs of the same chromium window
* Option to use a local CSV/TSV file to get inventory info from, instead of google sheets

### License

GPLv3 



