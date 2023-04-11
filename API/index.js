const moment = require("moment");
const Modbus = require("jsmodbus");
const net = require("net");
const colors = require("colors");
const dotenv = require("dotenv");
const mqtt = require("mqtt");
const { log, Console } = require("console");
dotenv.config();

/**
 * Esta función ejecuta consultas SQL y devuelve el resultado o un error a través de una función de
 * devolución de llamada.
 * @param query - La consulta SQL que se ejecutará en la base de datos.
 * @param callback - El parámetro `callback` es una función que se llamará una vez que se ejecute la
 * consulta. Toma dos parámetros: `error` y `resultado`.
 */
const { connection } = require("./config.db");
const { type } = require("os");
function ejecutarconsultas(query, callback) {
  connection.query(query, (error, result, fields) => {
    if (error) {
      callback(error, null);
    } else {
      callback(null, result);
    }
  });
}
// Consulta inicial a la base de datos para obtener los parámetros necesarios pra el funcionamiento de la API
ejecutarconsultas("select*from Rasp;", (error, result) => {
  if (!error) {
    //Construimos el tópicos base con los parámetros de la base de datos
    let TopicBase = `Cgr/${result[0].Num_OT}/${result[0].Calve_Rasp}`;

    /* crear una nueva instancia de un socket TCP utilizando el módulo `net` en Node.js.*/
    const socket = new net.Socket();

    /*Creamos un nuevo cliente Modbus TCP usando el socket proporcionado. El
    cliente se utilizará para comunicarse con un controlador lógico programable (PLC) a través del
    protocolo Modbus TCP. */
    const clientPLC = new Modbus.client.TCP(socket);

    /* `const options` está creando un objeto que contiene la información del host y del puerto
    necesaria para conectarse a un controlador lógico programable (PLC) usando el protocolo Modbus
    TCP. Los valores para `host` y `port` se obtienen de la primera fila de la tabla `Rasp` en la
    base de datos, específicamente de las columnas `Host_Plc` y `Port_Plc` respectivamente. Este
    objeto se utiliza posteriormente como argumento al crear un nuevo cliente Modbus TCP. */
    const options = {
      host: result[0].Host_Plc,
      port: result[0].Port_Plc,
    };

    /* `socket.connect(options);` está estableciendo una conexión TCP con un host remoto y un puerto
    especificado en el objeto `options`. En este caso, el objeto `opciones` contiene la información
    del host y del puerto para un controlador lógico programable (PLC) con el que se comunicará el
    código usando el protocolo Modbus TCP. Una vez que se establece la conexión, el objeto `socket`
    emite un evento `connect`. */
    socket.connect(options);

    /*Escuchar un evento de "conexión" en un socket y registra
    un mensaje en la consola cuando se activa el evento. */
    socket.on("connect", (err) => console.log("Conectado"));

    /* Detecta el evento"error" en un objeto del socket. 
    Cuando se emite el evento "error", el código registrará el mensaje de error en la
    consola. */
    socket.on("error", (err) => console.log(err));

    /*mqttURL que contiene una URL de
    WebSocket para conectarse a un agente de MQTT. La URL se construye mediante la interpolación de
    cadenas para incluir la información del host y del puerto obtenida de una matriz de "resultados". */
    const mqttURL = `ws://${result[0].Host_Mqtt}:${result[0].Port_Mqtt}/mqtt`;

    /* Client_Id y le asigna un valor de cadena que
    incluye la palabra "Server" seguida de un número aleatorio entre 1 y 10000. El propósito de
    este código es generar un identificador único.*/
    const Client_Id = `Server_${Math.floor(Math.random() * (10000 - 1 + 1) + 1)}`;

    /* opciones_mqtt con varias de propiedades para
    configurar una conexión de cliente MQTT. Estas propiedades incluyen el ID del cliente, si
    limpiar la sesión al desconectarse, el tiempo de actividad, la versión del protocolo, el tiempo
    de espera de la conexión y el período de reconexión. */
    const opciones_mqtt = {
      clientId: Client_Id,
      clean: true,
      keepalive: 3600,
      protocolVersion: 5,
      connectTimeout: 1000,
      reconnectPeriod: 5000,
    };
    // Iniciamos concexion al servidor MQTT
    const clientMQTT = mqtt.connect(mqttURL, opciones_mqtt);
    clientMQTT.on("connect", () => {
         clientMQTT.subscribe(`${TopicBase}/#`, (err) => {
            if (!err) {
                // Valida que el aun se encuentre la conecxion del plc
                let status = socket.resume()._readableState.destroyed;
                status ? socket.connect(options) : "";
              ejecutarconsultas("select*from parametros order by Tipo,Nombre asc",(error, resultP) => {
                  if (!error) {
                    setInterval(() => {
                      Fecha = moment().utcOffset("-06:00").format("YYYY-MM-DD HH:mm:ss");
                        resultP.map(function (Tipo, index) {
                            if (Tipo.Tipo == "BIT") {
                              clientPLC.readCoils(Tipo.Addr, 1).then((resultPLC) => {
                                  let ValorBoniba = resultPLC.response._body._valuesAsArray[0];
                                  // Enviar
                                  let EnviarDatos = {
                                    Nombre:Tipo.Nombre,
                                    Tipo:Tipo.Tipo,
                                    Valor:ValorBoniba,
                                    Variable:Tipo.Variable,
                                    Descripcion:Descripcion,
                                  };
                                  if(Tipo.Descripcion=="AVISOS FALLAS"){
                                    ejecutarconsultas(`select*from Registro_Falla where Id_Parametro='${Tipo.Id}' order by Id desc limit 1`, (errores, resultA) => {
                                      if (!errores) {
                                        if(Object.keys(resultA).length>0){
                                          if(Number(resultA[0].Valor)!=Number(ValorBoniba)){
                                            ejecutarconsultas(`insert into Registro_Falla(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`, (error, RGF) => {
                                              if (!error) {
                                                //console.log("success ".green);
                                              }
                                            });
  
                                          }
                                        }else{
                                          console.log("Insertar ");
                                          if(ValorBoniba==1){
                                            ejecutarconsultas(`insert into Registro_Falla(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`, (error, RGF) => {
                                              if (!error) {
                                                //console.log("success ".green);
                                              }
                                            });
  
                                          }
                                        }
                                      } else {
                                        //console.log("Error al ejecutar consulta ".red);
                                      }
                                    });
                                  }
                                  clientMQTT.publish(`${TopicBase}/${Tipo.Nombre}`, JSON.stringify(EnviarDatos),{ qos: 0, retain: false },
                                    (error) => {
                                      if (error) {
                                        //console.log("Error al publicar".red);
                                      }
                                    }
                                  );
                                })
                                .catch(function () {
                                  console.log("BIT " +require("util").inspect(arguments, { depth: null,}),null);
                                });
                            } else if (Tipo.Tipo == "FLOAT") {
                              clientPLC.readCoils(Tipo.Addr, 2).then((resultPLC) => {
                                let FLOAT = resultPLC.response._body._valuesAsArray;
        
                                  let Bufer = Buffer.allocUnsafe(4);
                                  Bufer.writeUInt16BE(FLOAT[0], 2);
                                  Bufer.writeUInt16BE(FLOAT[1], 0);
                                  let ValorR = Bufer.readFloatBE(0);
                                  // Enviar
                                  let EnviarDatos = {
                                    Nombre:Tipo.Nombre,
                                    Tipo:Tipo.Tipo,
                                    Valor:ValorR,
                                    Variable:Tipo.Variable,
                                    Descripcion:Descripcion,
                                  };
                                  clientMQTT.publish(`${TopicBase}/${Tipo.Nombre}`, JSON.stringify(EnviarDatos),{ qos: 0, retain: false },(error) => {
                                      if (error) {
                                        //console.log("Error al publicar".red);
                                      }
                                    });
                                }).catch(function () {
                                  console.error("FLOAT " +require("util").inspect(arguments, {depth: null,}));
                                });
                            } else {
                              clientPLC.readHoldingRegisters(Tipo.Addr, 1).then((resultPLC) => {
                                  let LecturaRegistros =resultPLC.response._body._valuesAsArray[0];
                                  // Enviar
                                  let EnviarDatos = {
                                    Nombre:Tipo.Nombre,
                                    Tipo:Tipo.Tipo,
                                    Valor:LecturaRegistros,
                                    Variable:Tipo.Variable,
                                    Descripcion:Descripcion,
                                  };
                                  clientMQTT.publish(`${TopicBase}/${Tipo.Nombre}`,JSON.stringify(EnviarDatos) + "",{ qos: 0, retain: false },(error) => {
                                      if (error) {
                                        //console.log("Error al publicar".red);
                                      }
                                    }
                                  );
                                })
                                .catch(function () {
                                  console.error("INT " +require("util").inspect(arguments, {depth: null,}));
                                });
                            }
                          });
                    }, result[0].Mqtt_Time);

                    setInterval(() => {
                        /* Utilizamos la biblioteca Moment.js para obtener la fecha y
                        la hora actuales en el formato "AAAA-MM-DD HH:mm:ss" con un desplazamiento
                        UTC de -06:00. 
                        */
                        Fecha = moment().utcOffset("-06:00").format("YYYY-MM-DD HH:mm:ss");
                        resultP.map(function (Tipo, index) {
                            if (Tipo.Tipo == "BIT") {
                              clientPLC.readCoils(Tipo.Addr, 1).then((resultPLC) => {
                                  let ValorBoniba =
                                    resultPLC.response._body._valuesAsArray[0];
                                  // Guardamos
                                    ejecutarconsultas(`insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`, (error, result) => {
                                        if (!error) {
                                          //console.log("success ".green);
                                        } else {
                                          //console.log("Error al ejecutar consulta ".red);
                                        }
                                      });
                                })
                                .catch(function () {
                                  console.log("BIT " +require("util").inspect(arguments, { depth: null,}),null);
                                });
                            } else if (Tipo.Tipo == "FLOAT") {
                              clientPLC.readCoils(Tipo.Addr, 2).then((resultPLC) => {
                                let FLOAT = resultPLC.response._body._valuesAsArray;
        
                                  let Bufer = Buffer.allocUnsafe(4);
                                  Bufer.writeUInt16BE(FLOAT[0], 2);
                                  Bufer.writeUInt16BE(FLOAT[1], 0);
                                  let ValorR = Bufer.readFloatBE(0);
                                  // Guardamos
                                    ejecutarconsultas(`insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorR}','${Fecha}');`, (error, result) => {
                                        if (!error) {
                                          //console.log("success ".green);
                                        } else {
                                          //console.log("Error al ejecutar consulta ".red);
                                        }
                                      });
                                })
                                .catch(function () {
                                  console.error("FLOAT " +require("util").inspect(arguments, {depth: null,}));
                                });
                            } else {
                              clientPLC.readHoldingRegisters(Tipo.Addr, 1).then((resultPLC) => {
                                  let LecturaRegistros =resultPLC.response._body._valuesAsArray;
                                  // Guardamos
                                    ejecutarconsultas(`insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${LecturaRegistros}','${Fecha}');`, (error, result) => {
                                        if (!error) {
                                          //console.log("success ".green);
                                        } else {
                                          //console.log("Error al ejecutar consulta ".red);
                                        }
                                      });

                                })
                                .catch(function () {
                                  console.error("INT " +require("util").inspect(arguments, {depth: null,}));
                                });
                            }
                          });

                    }, result[0].Mysql_Time);

                  } else {
                    console.log("Error al consultar parámetros");
                  }
                });
            } else {
              console.log("Error al suscribir");
            }
          });
      
    });

    clientMQTT.on("message", (topic, message) => {
          message = JSON.parse(message);
          let status = socket.resume()._readableState.destroyed;
          status ? socket.connect(options) : "";
          Fecha = moment().utcOffset("-06:00").format("YYYY-MM-DD HH:mm:ss");
          //console.log(Fecha);
            switch(topic){
              case`${TopicBase}/WR`:
              if(message.Addr!="" && message.Valor!=""){
                clientPLC.writeSingleCoil(message.Addr, message.Valor);
                // Guardamos
                ejecutarconsultas(`insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('SE ESCRIBIÓ EN UN REGISTRO','SE ESCRIBIÓ EL VALOR ${message.Addr} EN LA POSICIÓN ${message.Addr}','${Fecha}','${topic}');`, (error, result) => {
                  if (!error) {
                    //console.log("success ".green);
                  } else {
                    //console.log("Error al ejecutar consulta ".red);
                  }
                });
              }else{
                console.log("Vació");
              }
            break;
            case`${TopicBase}/on_off`:
                if(message.Addr!="" && message.Accion!=""){
                  let Addr=parseInt(message.Addr);
                  if(message.Accion=="on"){

                    clientPLC.writeSingleCoil(Addr, true);
                     // Guardamos
                     ejecutarconsultas(`insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('ENCENDIDO DE BOBINA','SE ENCENDIÓ UNA BOBINA EN LA POSITION ${Addr}','${Fecha}','${topic}');`, (error, result) => {
                      if (!error) {
                        //console.log("success ".green);
                      } else {
                        //console.log("Error al ejecutar consulta ".red);
                      }
                    });
                  }else if(message.Accion=="off"){
                    clientPLC.writeSingleCoil(Addr, false);
                     // Guardamos
                     ejecutarconsultas(`insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('APAGADO DE BOBINA','SE APAGO UNA BOBINA EN LA POSITION ${Addr}','${Fecha}','${topic}');`, (error, result) => {
                      if (!error) {
                        //console.log("success ".green);
                      } else {
                        //console.log("Error al ejecutar consulta ".red);
                      }
                    });
                  }
                }else{
                  console.log("Vació");
                }
              break;
            case`${TopicBase}/SQL`:
            console.log("mensaje ",message.query)
                if(message.query!="" && message.query!=undefined){
                  ejecutarconsultas(message.query, (error, result) => {
                    if (!error) {
                        // Guardamos
                        ejecutarconsultas(`insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('COMANDOS SQL','${message.query}','${Fecha}','${topic}');`, (errorI, resultI) => {
                          if (!errorI) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        });
                        clientMQTT.publish(`${TopicBase}/SQL/Result`,JSON.stringify(result),{ qos: 0, retain: false },(errorP) => {
                          if (errorP) {
console.log("Error al enviar");
                          }
                        });
                    }
                  });
                }
              break;
          }
    });

    clientMQTT.on("reconnect", () => {
      console.log("Reconectando a ");
    });

    clientMQTT.on("error", () => {
      console.log("ERROR AL CONECTAR".red);
    });

    clientMQTT.on("offline", () => {
      console.log("Revisa tu coneccion a internet".red);
    });
    clientMQTT.on("disconnect", () => {
      console.log("desconectado".red);
    });

/*----------------------------------------------------------------------------------------------------------------------------------------------------------------------\
|                                                                               MQTT ORGANISMO OPERADOR                                                                            |
\----------------------------------------------------------------------------------------------------------------------------------------------------------------------*/

const MqttOperador = `ws://broker.emqx.io:8083/mqtt`;
const connectMqttOperador = mqtt.connect(MqttOperador);
connectMqttOperador.on("connect", () => {
    connectMqttOperador.subscribe(`${TopicBase}/#`, (err) => {
        if (!err) {
            // Valida que el aun se encuentre la conecxion del plc
         let status = socket.resume()._readableState.destroyed;
         status ? socket.connect(options) : "";
         //console.log(" MQTT ORGANISMO OPERADOR ",TopicBase)
         ejecutarconsultas("select*from parametros where Permisos='S' order by Tipo asc",(error, resultP) => {
            if (!error) {
                setInterval(() => {
                    resultP.map(function (Tipo, index) {
                        if (Tipo.Tipo == "BIT") {
                          clientPLC.readCoils(Tipo.Addr, 1).then((resultPLC) => {
                              let ValorBoniba = resultPLC.response._body._valuesAsArray[0];
                              // Enviar
                              let EnviarDatos = {
                                Nombre:Tipo.Nombre,
                                Tipo:Tipo.Tipo,
                                Valor:ValorBoniba,
                              };
                              connectMqttOperador.publish(`${TopicBase}/${Tipo.Nombre}`, JSON.stringify(EnviarDatos),{ qos: 0, retain: false },
                                (error) => {
                                  if (error) {
                                    console.log("Error al publicar a MQTT ORGANISMO OPERADOR".red);
                                  }
                                }
                              );
                            })
                            .catch(function () {
                              console.log("BIT " +require("util").inspect(arguments, { depth: null,}),null);
                            });
                        } else if (Tipo.Tipo == "FLOAT") {
                          clientPLC.readCoils(Tipo.Addr, 2).then((resultPLC) => {
                            let FLOAT = resultPLC.response._body._valuesAsArray;
    
                              let Bufer = Buffer.allocUnsafe(4);
                              Bufer.writeUInt16BE(FLOAT[0], 2);
                              Bufer.writeUInt16BE(FLOAT[1], 0);
                              let ValorR = Bufer.readFloatBE(0);
                              // Enviar
                              let EnviarDatos = {
                                Nombre:Tipo.Nombre,
                                Tipo:Tipo.Tipo,
                                Valor:ValorR,
                              };
                              connectMqttOperador.publish(`${TopicBase}/${Tipo.Nombre}`, JSON.stringify(EnviarDatos),{ qos: 0, retain: false },(error) => {
                                  if (error) {
                                    console.log("Error al publicar a MQTT ORGANISMO OPERADOR".red);
                                  }
                                }
                              );
                            })
                            .catch(function () {
                              console.error("FLOAT " +require("util").inspect(arguments, {depth: null,}));
                            });
                        } else {
                          clientPLC.readHoldingRegisters(Tipo.Addr, 1).then((resultPLC) => {
                              let LecturaRegistros =resultPLC.response._body._valuesAsArray[0];
                              // Enviar
                              let EnviarDatos = {
                                Nombre:Tipo.Nombre,
                                Tipo:Tipo.Tipo,
                                Valor:LecturaRegistros,
                              };
                              connectMqttOperador.publish(`${TopicBase}/${Tipo.Nombre}`,JSON.stringify(EnviarDatos) + "",{ qos: 0, retain: false },(error) => {
                                  if (error) {
                                    console.log("Error al publicar a MQTT ORGANISMO OPERADOR".red);
                                  }
                                }
                              );
                            })
                            .catch(function () {
                              console.error("INT " +require("util").inspect(arguments, {depth: null,}));
                            });
                        }
                      });
                }, result[0].Mqtt_Time);

            }else{
                console.log("Error al consultar")
            }
         });
        }else{
            console.log("Error al suscrobirse")
        }
    });

});

  connectMqttOperador.on("reconnect", () => {
    console.log("Reconectando a ");
  });

  connectMqttOperador.on("error", () => {
    console.log("ERROR AL CONECTAR".red);
  });

  connectMqttOperador.on("offline", () => {
    console.log("Revisa tu coneccion a internet".red);
  });
  connectMqttOperador.on("disconnect", () => {
    console.log("desconectado".red);
  });
  } else {
    console.log("Error al consultar la base de datos");
  }
});

