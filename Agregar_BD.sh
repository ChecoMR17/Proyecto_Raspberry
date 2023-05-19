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
    Port_Mqtt int not null,
    Host_Operador_Mqtt nvarchar(100) not null,
    Port_Operador_Mqtt int not null,
    Mqtt_Time_Operador float not null,
    Topico_Operador_Mqtt nvarchar(50) not null,
    Ip_Publica nvarchar(50) null,
    longitud nvarchar(100) null,
    latitud nvarchar(100) null
  );
EOF
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
  insert into Rasp(Num_OT,Calve_Rasp,Mqtt_Time,Mysql_Time,Host_Plc,Port_Plc,Host_Mqtt,Port_Mqtt,Host_Operador_Mqtt,Port_Operador_Mqtt,Mqtt_Time_Operador,Topico_Operador_Mqtt) values('6419','6419_1','1000','5000','192.168.1.50','502','www.sistemaintegralrios.com','8080','8.tcp.ngrok.io','14394','60000','set');
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
    Permisos nvarchar(1) not null,
    UM nvarchar(20) null
  );
EOF
mysql -h $DB_HOST -P $DB_PORT -u $DB_USER_NAME -p$DB_PASSWORD_NAME $DB_NAME << EOF
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','301','CORR_FASE_1_TELE','CORRIENTE L1','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','303','CORR_FASE_2_TELE','CORRIENTE L2','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','305','CORR_FASE_3_TELE','CORRIENTE L3','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','307','VOLT_FASE_1_2_TELE','VOLTAJE L1-L2','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','309','VOLT_FASE_1_3_TELE','VOLTAJE L1-L3','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','311','VOLT_FASE_2_3_TELE','VOLTAJE L2-L3','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','313','VOLT_FASE_1_NTR_TELE','VOLTAJE L1-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','315','VOLT_FASE_2_NTR_TELE','VOLTAJE L2-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','317','VOLT_FASE_3_NTR_TELE','VOLTAJE L3-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','319','KW_TRBJ_FASE_1_TELE','POTENCIA ACTIVA 1','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','321','KW_TRBJ_FASE_2_TELE','POTENCIA ACTIVA 2','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','323','KW_TRBJ_FASE_3_TELE',' POTENCIA ACTIVA 3','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','325','POTENCIA_REACT_TELE','POTENCIA REACTIVA','L','S','KVAR');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','327','POTENCIA_APARENTE_TELE','POTENCIA APARENTE','L','S','KVAR');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','329','FACTOR_POTENCIA_TELE','FACTOR DE POTENCIA','L','S','%');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','331','NIVEL_DINAM_POZO_TELE','NIVEL DE POZO','L','S','M');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','333','FLUJO_INST_POZO_TELE','FLUJO INSTANTANEO POZO','L','S','L/S');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','335','FLUJO_ACUM_M3_POZO_TELE','FLUJO ACUMULADO POZO','L','S','M <sup>3</sup>');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','337','PRESION_POZO_TELE','PRESION DE POZO','L','S','Kg/Cm <sup>2</sup>');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','339','NIVEL_DINAM_REBOMBEO_TELE','NIVEL DE CISTERNA REBOMBEO','L','S','M');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','341','FLUJO_INST_REBOMBEO_TELE','FLUJO INSTANTANEO REBOMBEO','L','S','L/S');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','343','FLUJO_ACUM_M3_REBOMBEO_TELE','FLUJO ACUMULADO REBOMBEO','L','S','M <sup>3</sup>');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','345','PRESION_REBOMBEO_TELE','PRESION DE REBOMBEO','L','S','Kg/Cm <sup>2</sup>');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','347','NIVEL_TANQ_ELEVADO_1_TELE','NIVEL EN TANQUE ELEVADO 1','L','S','M');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','349','NIVEL_TANQ_ELEVADO_2_TELE','NIVEL EN TANQUE ELEVADO 2','L','S','M');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','351','NIVEL_CIST_SUPERFICIAL_TELE','NIVEL EN CISTERNA PIRAMIDAL','L','S','M');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','353','PB_ARRANQ_BOM_1_TELE','ENCENDER BOMBA 1','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','355','PB_ARRANQ_BOM_2_TELE','ENCENDER BOMBA 2','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','357','PB_ARRANQ_BOM_3_TELE','ENCENDER BOMBA 3','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','359','PB_RESET_TELE','RESET FALLAS','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','361','FALLA_FASE_TELE','FALLA DE FASE ACTIVA','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','363','PARO_EMER_TELE','PARO DE EMERGENCIA ACTIVO','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','365','FALLA_BOMBA_1_TELE','FALLA DE BOMBA POZO','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','367','FALLA_BOMBA_2_TELE','FALLA DE BOMBA REBOMBEO','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','369','FALLA_BOMBA_3_TELE','FALLA BOMBA CLORO','L','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','371','BOMBA_1_ON_TELE','BOMBA 1 ON','A','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','373','BOMBA_2_ON_TELE','BOMBA 2 ON','A','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('BIT','375','BOMBA_3_ON_TELE','BOMBA 3 ON','A','S','');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','377','HMI_FRECUENCIA_BOM_1','AJUSTAR FRECUENCIA BOMBA 1','A','S','Hz');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','379','HMI_FRECUENCIA_BOM_2','AJUSTAR FRECUENCIA BOMBA 2','A','S','Hz');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','381','HMI_FRECUENCIA_BOM_3','AJUSTAR FRECUENCIA BOMBA 3','A','S','Hz');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','383','CORR_FASE_1_TELE_B2','CORRIENTE L1','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','385','CORR_FASE_2_TELE_B2','CORRIENTE L2','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','387','CORR_FASE_2_TELE_B2','CORRIENTE L3','L','S','A');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','389','VOLT_FASE_1_2_TELE_B2','VOLTAJE L1-L2','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','391','VOLT_FASE_1_3_TELE_B2','VOLTAJE L1-L3','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','393','VOLT_FASE_2_3_TELE_B2','VOLTAJE L2-L3','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','395','VOLT_FASE_1_NTR_TELE_B2','VOLTAJE L1-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('INT','397','VOLT_FASE_2_NTR_TELE_B2','VOLTAJE L2-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','399','VOLT_FASE_3_NTR_TELE_B2','VOLTAJE L3-N','L','S','V');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','401','KW_TRBJ_FASE_1_TELE_B2','POTENCIA ACTIVA','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','403','KW_TRBJ_FASE_2_TELE_B2','POTENCIA ACTIVA 2','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','405','KW_TRBJ_FASE_3_TELE_B2','POTENCIA ACTIVA 3','L','S','KW');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','407','POTENCIA_REACT_TELE_B2','POTENCIA REACTIVA','L','S','KVAR');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','409','POTENCIA_APARENTE_TELE_B2','POTENCIA APARENTE','L','S','KVAR');
insert into parametros(Tipo,Addr,Nombre,Descripcion,Variable,Permisos,UM) values ('FLOAT','411','FACTOR_POTENCIA_TELE_B2','FACTOR DE POTENCIA','L','S','%');
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


