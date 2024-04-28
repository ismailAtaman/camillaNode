# camilllaNode
### What is camillaNode
camillaNode is a web based interface to control [CamillaDSP](https://github.com/HEnquist/camilladsp) and use it as an Equalizer.


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

Once it is running, go to the **Connections** tab and enter a name, the ip address and the port of the machine running CamilaDSP. If you don't know the port,  check it in your camilladsp.service file in /lib/systemd/system/camilladsp.service. Port will be the value that follows -p option. If there is no such file try `sudo service camilladsp status` and see what is the path to the service file.

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

## Running camillaNode as a service
You can setup a service to run camillaNode automatically when the device is booted by following the steps described below:

Create the camillanode.service file with your favourite editor, for example nano:
`sudo nano /lib/systemd/system/camillanode.service`

Enter the following text, change `WorkingDirectory` and `Environment` variables to the path where you saved camillaNode, save and close.

```
[Unit]
Description=camillaNode Service
After=network.target

[Service]
User=root
Group=nogroup
ExecStart=/usr/bin/node /home/rock/camillanode/index.js
WorkingDirectory=/home/**userName**/camillanode/
Environment=PATH=/home/**userName**/camillanode/
Restart=always

[Install]
WantedBy=multi-user.target
```

Afterwards enable the and start the service.
`systemctl enable camillanode`
`systemctl start camillanode`

Now camillaNode service will start automatically after boot.

## Updating camillaNode 

To update camillaNode, you need to stop the camillaNode service, download the updated files from github, and restart the service. All of this can be achieved simply with a straightforward bash script, provided below. 

Save this script in a .sh file (i.e. update.sh) and run it with `sudo bash update.sh`.

Before doing so, do not forget to make sure  **username**, **service name** and **path** are correct please.

```
#! /bin/bash
echo "This script will update camillaNode from github..."
sudo service camillanode stop
cd /home/<USERNAME>/camillanode/
git pull https://github.com/ismailAtaman/camilllaNode.git
sudo service camillanode start
```
