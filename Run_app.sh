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
# Ejecutamos el contenedor
sudo docker-compose -f docker-compose.yml up -d
# Esperamos 20 segundos antes de continuar
sleep 30
#Declaracion de variables
DB_HOST="127.0.0.1"
DB_PORT=3307
DB_NAME="telemetria"
DB_USER_NAME="Telemetria"
DB_PASSWORD_NAME="telemetria"
# Lista de tablas
Table1="Rasp"
Table2="parametros"
Table3="historial"
Table4="historial_acciones"
Table5="Registro_Falla"

table_exists_Table1=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$Table1' AND table_schema = '$DB_NAME';")
table_exists_Table2=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$Table2' AND table_schema = '$DB_NAME';")
table_exists_Table3=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$Table3' AND table_schema = '$DB_NAME';")
table_exists_Table4=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$Table4' AND table_schema = '$DB_NAME';")
table_exists_Table5=$(mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME -Nse "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = '$Table5' AND table_schema = '$DB_NAME';")

if [[ $table_exists_Table1 == 0 ]]; then
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  create table Rasp(
    Id int auto_increment primary key,
    Num_OT int not null,
    Calve_Rasp nvarchar(50) not null,
    Mqtt_Time float not null,
    Mysql_Time float not null,
    Host_Plc nvarchar(15) not null,
    Port_Plc int not null,
    Host_Mqtt nvarchar(100) not null,
    Port_Mqtt int not null
  );
EOF
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  insert into Rasp(Num_OT,Calve_Rasp,Mqtt_Time,Mysql_Time,Host_Plc,Port_Plc,Host_Mqtt,Port_Mqtt) values('6419','6419_1','1000','600000','192.168.1.50','502','www.sistemaintegralrios.com','8080');
EOF
fi

if [[ $table_exists_Table2 == 0 ]]; then
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  create table parametros(
    Id int auto_increment primary key,
    Tipo nvarchar(10) not null,
    Addr int not null,
    Nombre nvarchar(50) null,
    Descripcion nvarchar(150) not null,
    Variable nvarchar(1) not null,
    Permisos nvarchar(1) not null
  );
EOF
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','301','CORR_FASE_1_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','303','CORR_FASE_2_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','305','CORR_FASE_3_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','307','VOLT_FASE_1_2_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','309','VOLT_FASE_1_3_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','311','VOLT_FASE_2_3_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','313','VOLT_FASE_1_NTR_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','315','VOLT_FASE_2_NTR_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','317','VOLT_FASE_3_NTR_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','319','KW_TRBJ_FASE_1_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','321','KW_TRBJ_FASE_2_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','323','KW_TRBJ_FASE_3_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','325','POTENCIA_REACT_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','327','POTENCIA_APARENTE_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','329','FACTOR_POTENCIA_TELE','DATOS ELECTRICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','331','NIVEL_DINAM_POZO_TELE','DATOS BOMBA POZO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','333','FLUJO_INST_POZO_TELE','DATOS BOMBA POZO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','335','FLUJO_ACUM_M3_POZO_TELE','DATOS BOMBA POZO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','337','PRESION_POZO_TELE','DATOS BOMBA POZO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','339','NIVEL_DINAM_REBOMBEO_TELE','DATOS REBOMBEO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','341','FLUJO_INST_REBOMBEO_TELE','DATOS REBOMBEO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','343','FLUJO_ACUM_M3_REBOMBEO_TELE','DATOS REBOMBEO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','345','PRESION_REBOMBEO_TELE','DATOS REBOMBEO','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','347','NIVEL_TANQ_ELEVADO_1_TELE','DATOS RADAR','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','349','NIVEL_TANQ_ELEVADO_2_TELE','DATOS RADAR','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('FLOAT','351','NIVEL_CIST_SUPERFICIAL_TELE','DATOS RADAR','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','353','PB_ARRANQ_BOM_1_TELE','BOTONES FISICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','355','PB_ARRANQ_BOM_2_TELE','BOTONES FISICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','357','PB_ARRANQ_BOM_3_TELE','BOTONES FISICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','359','PB_RESET_TELE','BOTONES FISICOS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','361','FALLA_FASE_TELE','AVISOS FALLAS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','363','PARO_EMER_TELE','AVISOS FALLAS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','365','FALLA_BOMBA_1_TELE','AVISOS FALLAS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','367','FALLA_BOMBA_2_TELE','AVISOS FALLAS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','369','FALLA_BOMBA_3_TELE','AVISOS FALLAS','L','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','371','BOMBA_1_ON_TELE','ESTADO DE BOMBAS','A','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','373','BOMBA_2_ON_TELE','ESTADO DE BOMBAS','A','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('BIT','375','BOMBA_3_ON_TELE','ESTADO DE BOMBAS','A','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','377','HMI_FRECUENCIA_BOM_1','FRECUENCIA BOMBAS  (MAXIMOS Y MINIMOS)','A','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','379','HMI_FRECUENCIA_BOM_2','FRECUENCIA BOMBAS  (MAXIMOS Y MINIMOS)','A','S');
  insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos) values ('INT','381','HMI_FRECUENCIA_BOM_3','FRECUENCIA BOMBAS  (MAXIMOS Y MINIMOS)','A','S');
EOF
fi

if [[ $table_exists_Table3 == 0 ]]; then
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  create table historial(
    Id bigint auto_increment primary key,
    Id_Parametro int not null,
    foreign key (Id_Parametro) references parametros(Id),
    Valor nvarchar(20) not null,
    Fecha datetime not null
  );
EOF
fi

if [[ $table_exists_Table4 == 0 ]]; then
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  create table historial_acciones(
    Id bigint auto_increment primary key,
    Nombre nvarchar(250) not null,
    Descripcion nvarchar(250) not null,
    Fecha datetime not null,
    Topico nvarchar(250) not null
  );
EOF
fi

if [[ $table_exists_Table4 == 0 ]]; then
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  create table Registro_Falla(
	Id bigint auto_increment primary key,
	Id_Parametro int not null,
    foreign key (Id_Parametro) references parametros(Id),
    Valor nvarchar(20) not null,
    Fecha datetime not null
  );
EOF
fi
# Esperamos 20 segundos antes de continuar
sleep 30
#Desplegar la aplicación
cd API
sudo npm install
pm2 start index.js
pm2 startup

