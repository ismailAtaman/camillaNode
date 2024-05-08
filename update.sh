#!/bin/bash
systemctl stop camillanode
git pull https://github.com/ismailAtaman/camillaNode.git
systemctl start camillanode