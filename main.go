package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/opensourcelan/linksys-config/configprovider"
	"github.com/opensourcelan/linksys-config/inventory"
	"github.com/opensourcelan/linksys-config/telnetpusher"
	"github.com/opensourcelan/linksys-config/tftpserver"
)

func main() {
	if len(os.Args) < 3 {
		fmt.Printf("Expects 2 or more arguments. First argument: print (the config) or push (the config to a switch)\nThen at least one or more Switch IPs to generate for")
		return
	}
	cfg := loadConfig()
	switches := inventory.ReadTheData(cfg.GoogleSheetID)
	cfgProvider := configprovider.GetConfigProvider(switches)

	if os.Args[1] == "print" {
		cfg, err := cfgProvider(os.Args[2])
		if err != nil {
			panic(err)
		}
		fmt.Println(cfg)
		return
	} else if os.Args[1] == "push" {

		go tftpserver.ServeTFTP(cfg.TftpFilename, cfgProvider)

		telnetpusher.AskSwitchToPullConfig(os.Args[2], cfg.Username, cfg.Password, cfg.TftpServerIp, cfg.TftpFilename)
	} else {
		fmt.Println("print or push required for first arg")
	}
}

type config struct {
	GoogleSheetID string `json:"google_spreadsheet_id"`
	Username      string `json:"username"`
	Password      string `json:"password"`
	TftpServerIp  string `json:"tftp_server_ip"`
	TftpFilename  string `json:"tftp_filename"`
}

func loadConfig() config {
	d, err := os.ReadFile("config.json")
	if err != nil {
		panic(err)
	}
	var c config
	err = json.Unmarshal(d, &c)
	if err != nil {
		panic(err)
	}
	return c
}
