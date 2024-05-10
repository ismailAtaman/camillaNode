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

mkdir /home/${username}/camilladsp 

# mkdir /home/${username}/dev/test/camillanode
# mkdir /home/${username}/dev/test/systemd/
# mkdir /home/${username}/dev/test/etc/

cp setupFiles/camilladsp.service /etc/systemd/system/camilladsp.service
cp setupFiles/camilladsp2.service /etc/systemd/system/camilladsp2.service
cp setupFiles/camillanode.service /etc/systemd/system/camillanode.service
cp setupFiles/default.yml /home/${username}/camilladsp/
cp setupFiles/spectrum.yml /home/${username}/camilladsp/
cp setupFiles/asound.conf /home/${username}/etc/

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


cd /home/${username}/camilladsp
wget https://github.com/HEnquist/camilladsp/releases/download/v2.0.3/camilladsp-linux-aarch64.tar.gz -P ~/camilladsp/
sudo tar -xvf ~/camilladsp/camilladsp-linux-aarch64.tar.gz -C /home/${username}/dev/test/

systemctl enable camilladsp.service
systemctl enable camilladsp2.service
systemctl enable camillanode.service

echo "Install and configuration of CamillaNode is complete. Check for error message to see if something went wrong."
echo "Would you like to reboot now?(y/n)?"

read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then 
    echo "Rebooting.."
    sudo reboot
else
    echo "Please reboot for changes to take effect."
    exit
fi