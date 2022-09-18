package telnetpusher

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/reiver/go-oi"
	"github.com/reiver/go-telnet"
)

func AskSwitchToPullConfig(ip string, username string, password string, tftpHost string, tftpFile string) {

	var caller = &SwitchCommunicator{
		Username:      username,
		Password:      password,
		PrintToStdout: true,
		CopyStartRun:  true,
		TftpIpAddr:    tftpHost,
		TftpFilename:  tftpFile,
	}
	err := telnet.DialToAndCall(ip+":23", caller)
	fmt.Println(err)

}

// The telnet library uses a Caller, which is a type that knows how to send data to
// the telnet connection and read the data that's returned.
// This type does that. It knows how to interact with the switch's menus
type SwitchCommunicator struct {
	Username      string
	Password      string
	CopyStartRun  bool
	PrintToStdout bool
	TftpFilename  string
	TftpIpAddr    string
}

func (sc *SwitchCommunicator) CallTELNET(ctx telnet.Context, w telnet.Writer, r telnet.Reader) {

	// TODO: major tidy up and error checking and etc in this function
	// TODO: parse the data being returned and check it for expected values before proceeding

	go func(writer io.Writer, reader io.Reader) {

		var buffer [1]byte
		p := buffer[:]

		for {
			// Read 1 byte.
			n, err := reader.Read(p)
			if n <= 0 && nil == err {
				continue
			} else if n <= 0 && nil != err {
				break
			}

			// There will be lots of terminal control commands, such as moving cursor around, updating text
			// Below will strip them out so you can see a linear log of what changes were made.
			// for i := 0; i < n; i++ {
			// 	if p[i] > 128 || p[i] < ' ' {
			// 		p[i] = ' '
			// 	}

			// }

			if sc.PrintToStdout {
				oi.LongWrite(writer, p)
			}
		}
	}(os.Stdout, r)

	time.Sleep(time.Second)

	// login screen
	w.Write([]byte(sc.Username + "\t" + sc.Password + "\r\n"))
	// Expect on bad creds: Bad user name or password or user has no privilege to enter the menu
	// ... then press enter to try again
	// Expect on success: menu shows, look for text:  System Configuration Menu

	time.Sleep(time.Second)

	// open menu entry 1.  System Configuration Menu
	w.Write([]byte("1\r\n"))
	time.Sleep(time.Second)

	// open menu entry 5. File Management
	w.Write([]byte("5\r\n"))
	time.Sleep(time.Second)

	// open menu  1. Upgrade / Backup (IPv4)
	w.Write([]byte("1\r\n"))
	time.Sleep(time.Second)

	// Move curosr to edit
	w.Write([]byte("\t"))
	time.Sleep(time.Second)

	// Go in to edit mode
	w.Write([]byte("\r\n"))
	time.Sleep(time.Second)

	// Space toggles between options.
	// Select Source: tftp
	// Select Destination: startup-config(1 space).. or... running-config (2 spaces)
	// Enter filename: asdf.txt
	// Enter IP: 10.0.0.1
	w.Write([]byte("    \t"))
	time.Sleep(time.Second)
	w.Write([]byte(" \t"))
	time.Sleep(time.Second)
	w.Write([]byte(sc.TftpFilename + "\t"))
	time.Sleep(time.Second)
	w.Write([]byte(sc.TftpIpAddr))
	time.Sleep(time.Second)

	// Send escape to exit form-edit-mode
	w.Write([]byte("\x1B"))
	time.Sleep(time.Second)

	// Tab to Execute. Execute.
	w.Write([]byte("\t\r\n"))

	// Expect on file not found error: Abort from tftp server - file not found
	// Expect on success: Operation complete

	time.Sleep(15 * time.Second)

	if !sc.CopyStartRun {
		return
	}

	// Remainder of this flow is for copying the startup file in to active running config

	// operation finished, now highlight Quit, and exit back up one level
	w.Write([]byte("\t\t\t\r\n"))
	time.Sleep(time.Second)

	w.Write([]byte("1\r\n"))
	time.Sleep(time.Second)

	// Move curosr to edit
	w.Write([]byte("\t"))
	time.Sleep(time.Second)

	// Go in to edit mode
	w.Write([]byte("\r\n"))
	time.Sleep(time.Second)

	// Space toggles between options.
	// Select Source: startup-config (the default one)
	// Select Destination: running-config (2 spaces)
	// Enter filename: (nothing))
	// Enter IP: (nothing)
	w.Write([]byte("\t"))
	time.Sleep(time.Second)
	w.Write([]byte("  \t"))
	time.Sleep(time.Second)

	// Send escape to exit form-edit-mode
	w.Write([]byte("\x1B"))
	time.Sleep(time.Second)

	// Tab to Execute. Execute.
	w.Write([]byte("\t\r\n"))
	time.Sleep(10 * time.Second)

	// This seems to say "Copy completed with errors" when it finishes.
}
