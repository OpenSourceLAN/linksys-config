
# Linksys config

A tool to upload configs to Linksys switches so you don't have to use the web interface.


WARNING: Does not quite work yet. There is some magic that happens in the web UI that
enables file uploads. I haven't figured out what the magic is yet. But, this script
will work 100% of the time if you browse to the "Configuration & Log" page of the web
config in a browser, and then immediately run the script once (you need to reload the
page for any subsequent script executions)

You can tell by all of the crap in the code that I've been trying a bunch of different
approaches, including mirroring all of the requests made by the browser when loading
the page.

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



