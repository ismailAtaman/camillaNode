#!/bin/bash
echo "g_audio" > "/etc/modules"
cp setupFiles/usb_g_audio.conf /etc/modprobe.d/usb_g_audio.conf

echo "First step of install and configuration of CamillaNode is complete. Check for error message to see if something went wrong."
echo "Would you like to reboot now?(y/n)?"
read answer

if [ "$answer" != "${answer#[Yy]}" ] ;then 
    echo "Rebooting.."
    sudo reboot
else
    echo "Please reboot for changes to take effect."
    exit
fi


