package tftpserver

import (
	"io"
	"strings"

	"github.com/pin/tftp/v3"
	"github.com/pkg/errors"
)

func ServeTFTP(expectFilename string, configGenerator func(ip string) (string, error)) {
	s := tftp.NewServer(func(filename string, rf io.ReaderFrom) error {
		if filename != expectFilename {
			return errors.Errorf("file %s not found", filename)
		}
		raddr := rf.(tftp.OutgoingTransfer).RemoteAddr()

		c, err := configGenerator(raddr.IP.String())
		if err != nil {
			return errors.Wrapf(err, "could not generate config for %s", raddr.IP.String())
		}

		_, err = rf.ReadFrom(strings.NewReader(c))
		return errors.Wrap(err, "could not server config")

	}, nil)

	err := s.ListenAndServe(":69")
	if err != nil {
		panic(err)
	}

}
