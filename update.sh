#!/bin/bash
git stash
systemctl stop camillanode
git pull https://github.com/ismailAtaman/camillaNode.git
systemctl start camillanode