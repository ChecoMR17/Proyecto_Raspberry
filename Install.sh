#!/bin/bash
logo="
  _____     _____ __    ______ _______ ___________
  \_   \___/__   ___\ /   ___/  _____/     ()    / 
   / /\/ _ \ / /     |   /   |  |  __\     __    \ 
/\/ /_| (_) / /      |   \___|  |__\  \   \   \   \ 
\____/ \___/\/        \ ______\________\____\  \___\ 

           CORPORATIVO GRUPO RIOS S.A. DE C.V.
"
echo "$logo"
#Actualizamos el sistema
sudo apt-get update && sudo apt-get upgrade -y && sudo apt-get dist-upgrade -y
#Instalacion de docker y plugin
sudo apt-get install docker.io -y && sudo apt install docker-compose -y
#Intstalacion de lamp
sudo apt-get install apache2 -y && sudo apt install php -y && sudo apt install mariadb-server -y
# Instalar nodejs
sudo apt-get update
sudo curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install pm2 -g
sudo pm2 install pm2-server-monit
sudo pm2 install pm2-logrotate
sudo chmod +x Run_app.sh
sudo chmod +x Agregar_BD.sh
sudo apt-get autoremove -y
sudo shutdown -r now
