
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
work without headless Chrome in `cruft.js`, just in case they're useful
in the future. :)

### Compatibility

Tested with a Linksys LGS326 (firmare v1.1.0.21) and LGS552 (firmare
v1.1.0.27)

### Usage

Make a config.json file like this:

```
{
"username":	"admin",
"password": "admin",
"host": "192.168.1.251",
"config-filename": "running-config.txt"
}
```

And put your config file to uplaod in `running-config.txt`.
Then run `npm install && node app.js`

Once this works, I'll add command line flags for this so it's easier to automate.

### License

GPLv3 



