#!/bin/bash
echo "Enter username chosen during for installation"
read username
echo "Enter device name of the input device (use 'arecord -l' to check)"
read inputdevice
echo "Enter device name of the output device (use 'aplay -l' to check)"
read outputdevice

printf 'Username : '${username}' , Input Device Name : '${inputdevice}', Output Device Name : '${outputdevice}' \nIs this information correct?(y/n)? '
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then 
    echo "Yes. Installing..."
else
    echo "Install script aborted."
    exit
fi

mkdir /home/${username}/dev/test/camilladsp 
mkdir /home/${username}/dev/test/camillanode

mkdir /home/${username}/dev/test/systemd/
mkdir /home/${username}/dev/test/etc/

cp setupFiles/camilladsp.service /home/${username}/dev/test/systemd/
cp setupFiles/camilladsp2.service /home/${username}/dev/test/systemd/
cp setupFiles/camillanode.service /home/${username}/dev/test/systemd/
cp setupFiles/default.yml /home/${username}/dev/test/camilladsp/
cp setupFiles/spectrum.yml /home/${username}/dev/test/camilladsp/
cp setupFiles/asound.conf /home/${username}/dev/test/etc/

file=/home/${username}/dev/test/systemd/camilladsp.service
sed -i -e 's/USERNAME/'${username}'/g' ${file}

file=/home/${username}/dev/test/systemd/camilladsp2.service
sed -i -e 's/USERNAME/'${username}'/g' ${file}

file=/home/${username}/dev/test/systemd/camillanode.service
sed -i -e 's/USERNAME/'${username}'/g' ${file}

file=/home/${username}/dev/test/etc/asound.conf
sed -i -e 's/INPUTDEVICE/'${inputdevice}'/g' ${file}

file=/home/${username}/dev/test/camilladsp/default.yml
sed -i -e 's/OUTPUTDEVICE/'${outputdevice}'/g' ${file}


cd /home/${username}/dev/test/camilladsp
#wget https://github.com/HEnquist/camilladsp/releases/download/v2.0.3/camilladsp-linux-aarch64.tar.gz -P ~/camilladsp/
#sudo tar -xvf ~/camilladsp/camilladsp-linux-aarch64.tar.gz -C /home/${username}/dev/test/



# ls -i "$file"
# printf '%s' H ".g/^USERNAME.*/s//${username}/" wq | ed -s "$file"
# ls -i "$file"

#cd /home/${username}/camillanode
#sudo apt update
#sudo apt install npm
#sudo apt install git
#git init 
#git pull https://github.com/ismailAtaman/camillaNode.git
#npm install
#bash install.sh

#systemctl enable camilladsp.service
#systemctl enable camilladsp2.service
#systemctl enable camillanode.service

echo "Install of CamillaNode is complete."