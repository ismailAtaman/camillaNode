# camilllaNode
### What is camillaNode
camillaNode is a web based interface to control CamillaDSP and use it as an Equalizer.


### Installation

#### Prerequisites 
camillaNode uses node.js. If you dont have it installed already, you can install it from [here](https://nodejs.org/en/download) or directly from command line with `sudo apt install npm`

Installing camillaNode requires you to download it from GitHub and installing required dependencies using NPM, all all which can be achieved as follows:

```
git init
git pull https://github.com/ismailAtaman/camilllaNode.git
npm install
```

To start the web service just run it with `node .` Admin privialages might be required.

Once it is running, go to the **Server** tab and enter a name, the ip address and the port of the machine running CamilaDSP. If you don't know the port,  check it in your camilladsp.service file in /lib/systemd/system/camilladsp.service. Port will be the value that follows -p option. If there is no such file try `sudo service camilladsp status` and see what is the path to the service file.

If you are going to run cammillaNode on a seperate PC or Mac to control a CamillaDSP running on a separate device, you need to make sure CamillaDSP is initialized with `-a 0.0.0.0` option. That binds the websocket server to the external network interface so that you can reach camillaDSP from another computer running on your network.

### Usage

There are four tabs in the app.

#### Server 
The one you just used to configure settings to connect to CamillaDSP

#### Device 
Shows you the basic device settings. It is not a comprehensive list. I have not included anything I don't change here - just the very basics.

#### Preferences 
This is the tab with which you can make changes to color theme, enable/disable some functionality, change font sizes etc.

#### Equalizer 
This is where all the controls happen. Hope it will be all straightforward to EQ APO users. If not please do ask. For AutoEQ, headphone list loads AutoEQ settings for Oratory1990 and IEM list loads Crinicle's. Currently there is no option to change this, but am planning to add that in the future. Once loaded, you can save the EQ settings directly, or make changes and save afterwards. It is your ears and your taste after all.

