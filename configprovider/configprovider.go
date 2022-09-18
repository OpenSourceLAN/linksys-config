package configprovider

import (
	"bytes"
	"html/template"
	"strconv"
	"strings"

	"github.com/opensourcelan/linksys-config/inventory"
	"github.com/pkg/errors"
)

type ConfigProvider func(ip string) (string, error)

func GetConfigProvider(switches []inventory.SwitchData) ConfigProvider {

	t, err := template.ParseFiles("switch-config-template.tmpl")
	if err != nil {
		panic(err)
	}

	return func(ip string) (string, error) {

		cfg, found := configForSwitch(ip, switches)
		if !found {
			return "", errors.Errorf("switch IP %s not found in database", ip)
		}
		buf := new(bytes.Buffer)
		err = t.Execute(buf, cfg)

		return buf.String(), errors.Wrapf(err, "could not generate config for %s", ip)
	}
}

func configForSwitch(ip string, switches []inventory.SwitchData) (templateConfig, bool) {
	var theSwitch *inventory.SwitchData
	for i := range switches {
		if switches[i].IP == ip {
			theSwitch = &switches[i]
			break
		}
	}

	if theSwitch == nil {
		return templateConfig{}, false
	}

	tc := templateConfig{
		Hostname:     theSwitch.Name,
		Location:     theSwitch.Name,
		SnmpSecret:   "TODO",
		Ports:        portsForSwitch(*theSwitch),
		PortChannels: portChannelForSwitch(*theSwitch),
		Vlans: []vlan{
			// TODO: not hardcoding these
			{Name: "", Id: "1"},
			{Name: "device-mgmt", Id: "10", IpAddress: theSwitch.IP},
			{Name: "servers", Id: "11"},
			{Name: "pcfp", Id: "16"},
			{Name: "cfp", Id: "17"},
			{Name: "santa", Id: "32"},
			{Name: "pcfpadmin", Id: "33"},
		},
	}

	return tc, true
}

func portsForSwitch(sw inventory.SwitchData) []portConfig {
	count := numberRegularGigEthPortsForDevice(sw.Model)

	ports := make([]portConfig, count)

	for i := range ports {
		ports[i].PortNumber = strconv.FormatInt(int64(i+1), 10)
		ports[i].VlanId = sw.DefaultVLAN
	}
	return ports
}

func portChannelForSwitch(sw inventory.SwitchData) []portChannel {
	uplinkPort := int64(1 + numberRegularGigEthPortsForDevice(sw.Model))
	return []portChannel{
		{
			PortChannelId:     "1",
			GigEthPortMembers: []string{strconv.FormatInt(uplinkPort, 10), strconv.FormatInt(uplinkPort+1, 10)},
			VlanIds:           []string{sw.DefaultVLAN}, // TODO: include all
			NativeVlan:        "10",
		},
	}
}

func numberRegularGigEthPortsForDevice(model string) int {
	switch strings.ToUpper(model) {
	case "LGS326":
		return 24
	case "LGS552":
		return 48
	case "LGS318", "LGS318P":
		return 16
	default:
		return 0
	}
}

type templateConfig struct {
	Hostname     string
	Location     string
	SnmpSecret   string
	Ports        []portConfig
	PortChannels []portChannel
	Vlans        []vlan
}

func (tc templateConfig) VlanIdsComma() string {
	ids := make([]string, 0, len(tc.Vlans))
	for _, v := range tc.Vlans {
		ids = append(ids, v.Id)
	}
	return strings.Join(ids, ",")
}

type portConfig struct {
	VlanId     string
	PortNumber string
}
type portChannel struct {
	PortChannelId     string
	GigEthPortMembers []string
	TenGigMembers     []string
	VlanIds           []string
	NativeVlan        string
}

func (pc *portChannel) AllowedVlans() string { return strings.Join(pc.VlanIds, ",") }

type vlan struct {
	Name      string
	Id        string
	IpAddress string
}
