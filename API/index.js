/* Importamos los módulos y bibliotecas necesarios, como moment, jsmodbus, net, colors,
dotenv y mqtt. También está configurando las variables de entorno usando dotenv.*/
const moment = require("moment");
const Modbus = require("jsmodbus");
const net = require("net");
const colors = require("colors");
const dotenv = require("dotenv");
const mqtt = require("mqtt");
const request = require("request");
const http = require("http");
const { log, Console } = require("console");
const { exec } = require("child_process");
dotenv.config();

/* Importa el objeto `conexión` desde un archivo llamado `config.db` y lo asigna a
una variable connection. El propósito de este código es establecer una conexión a la base de datos
usando el objeto `conexión` */
const { connection } = require("./config.db");

/**
 * Esta función ejecuta varias consultas SQL y devuelve el resultado o un error a través de una función de
 * devolución de llamada.
 * @param query - La consulta SQL que se ejecutará en la base de datos.
 * @param callback - El parámetro de devolución de llamada es una función que se llamará después de
 * ejecutar la consulta. Toma dos parámetros: error y resultado. Si hay un error, el parámetro de error
 * contendrá el mensaje de error; de lo contrario, será nulo. Si la consulta tiene éxito, el parámetro
 * de resultado contendrá el resultado.
 */
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
    socket.on("connect", (err) => console.log("Conectado al PLC"));

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
    const Client_Id = `Server_${Math.floor(
      Math.random() * (10000 - 1 + 1) + 1
    )}`;

    http
      .get("http://httpbin.org/ip", (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const publicIp = JSON.parse(data).origin;
          const apiUrl = `http://ip-api.com/json/${publicIp}`;
          let location;
          request(apiUrl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
              location = JSON.parse(body);
              latitude = location.lat;
              longitude = location.lon;
            }
            ejecutarconsultas(
              `update Rasp set Ip_Publica='${publicIp}',longitud='${latitude}',latitud='${longitude}' where Id='1';`,
              (error, Result_R) => {
                if (!error) {
                  //console.log("success ".green);
                }
              }
            );
            /*console.log(publicIp);
            console.log(location.lat, location.lon);*/
          });
        });
      })
      .on("error", (err) => {
        console.log("Error: " + err.message);
      });

    /* opciones_mqtt con varias de propiedades para
    configurar una conexión de cliente MQTT. Estas propiedades incluyen el ID del cliente, si
    limpiar la sesión al desconectarse, el tiempo de actividad, la versión del protocolo, el tiempo
    de espera de la conexión y el período de reconexión. */
    const opciones_mqtt = {
      clientId: Client_Id,
      clean: true,
      keepalive: 5000,
      protocolVersion: 5,
      connectTimeout: 1000,
      reconnectPeriod: 5000,
    };
    /* Conexión al broker, Se utiliza la biblioteca MQTT.js en JavaScript.
    La variable `mqttURL` contiene la URL del intermediario al que conectarse (broker), y la variable
    `opciones_mqtt` contiene cualquier opción adicional para la conexión. La función
    `mqtt.connect()` se usa para establecer la conexión con el intermediario (broker) y devuelve un objeto de
    cliente que se puede usar para publicar y suscribirse a temas de MQTT. */
    const clientMQTT = mqtt.connect(mqttURL, opciones_mqtt);

    /* Conexión al broker.*/
    clientMQTT.on("connect", () => {
      console.log("Conectado al broker de CGR");
      /* Se suscribe a todos los temas que comienzan con el tópico base,
      utilizando el cliente MQTT `clientMQTT`. El símbolo `#` es un carácter comodín que coincide
      con cualquier cadena después de `/`. */
      clientMQTT.subscribe(`${TopicBase}/#`, (err) => {
        /* Si la variable `err` no es falso, se ejecutará el código dentro de la instrucción
        if. */
        if (!err) {
          /* Verifica el estado de una conexión de socket y, si se destruye,
          intentará volver a conectarse utilizando las opciones proporcionadas. */
          let status = socket.resume()._readableState.destroyed;
          status ? socket.connect(options) : "";
          /* Ejecutando una consulta SQL para seleccionar todas las columnas de
          la tabla "parámetros". Los resultados de la consulta se pasan a una función de devolución de llamada
          como un parámetro denominado "resultP". */
          ejecutarconsultas(
            "select*from parametros order by Tipo,Nombre asc",
            (error, resultP) => {
              if (!error) {
                /* El método setInterval() para ejecutar repetidamente un bloque
                de código o una función en un intervalo específico (en milisegundos) y es utilizado para que consulte los registros añ plc en un determinado tiempo */
                setInterval(() => {
                  /* Utilizamos la biblioteca Moment.js para obtener la fecha y la hora
                  actuales en el formato "AAAA-MM-DD HH:mm:ss" con un desplazamiento UTC de -06:00. */
                  Fecha = moment()
                    .utcOffset("-06:00")
                    .format("YYYY-MM-DD HH:mm:ss");
                  let latitude;
                  let longitude;
                  /* El método `map()` se utiliza para iterar sobre cada elemento de la matriz y realizar
                  una función en cada elemento. La función que se ejecuta toma dos parámetros,
                  `Tipo` e `index` con los valores de la consulta a la base de datos */
                  resultP.map(function (Tipo, index) {
                    if (Tipo.Tipo == "BIT") {
                      clientPLC
                        .readCoils(Tipo.Addr, 1)
                        .then((resultPLC) => {
                          let ValorBoniba =
                            resultPLC.response._body._valuesAsArray[0];
                          // Enviar
                          // -----------------------------------------------------

                          //------------------------------------------------------
                          let EnviarDatos = {
                            fecha_hora: Fecha,
                            id_estacion: result[0].Calve_Rasp,
                            nombre_estacion: result[0].Nombre_Estacion,
                            Ip_Publica: result[0].Ip_Publica,
                            Ubicacion: {
                              longitud: result[0].longitud,
                              latitud: result[0].latitud,
                            },
                            Addr: Tipo.Addr,
                            Nombre: Tipo.Nombre,
                            Tipo: Tipo.Tipo,
                            Valor: ValorBoniba,
                            Variable: Tipo.Variable,
                            Descripcion: Tipo.Descripcion,
                            UM: Tipo.UM,
                          };
                          if (Tipo.Descripcion == "AVISOS FALLAS") {
                            ejecutarconsultas(
                              `select*from Registro_Falla where Id_Parametro='${Tipo.Id}' order by Id desc limit 1`,
                              (errores, resultA) => {
                                if (!errores) {
                                  if (Object.keys(resultA).length > 0) {
                                    if (
                                      Number(resultA[0].Valor) !=
                                      Number(ValorBoniba)
                                    ) {
                                      ejecutarconsultas(
                                        `insert into Registro_Falla(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                                        (error, RGF) => {
                                          if (!error) {
                                            //console.log("success ".green);
                                          }
                                        }
                                      );
                                    }
                                  } else {
                                    //console.log("Insertar ");
                                    if (ValorBoniba == 1) {
                                      ejecutarconsultas(
                                        `insert into Registro_Falla(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                                        (error, RGF) => {
                                          if (!error) {
                                            //console.log("success ".green);
                                          }
                                        }
                                      );
                                    }
                                  }
                                } else {
                                  //console.log("Error al ejecutar consulta ".red);
                                }
                              }
                            );
                          }
                          clientMQTT.publish(
                            `${TopicBase}/${Tipo.Nombre}`,
                            JSON.stringify(EnviarDatos),
                            { qos: 0, retain: false },
                            (error) => {
                              if (error) {
                                //console.log("Error al publicar".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.log(
                            "BIT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              }),
                            null
                          );
                        });
                    } else if (Tipo.Tipo == "FLOAT") {
                      clientPLC
                        .readHoldingRegisters(Tipo.Addr, 2)
                        .then((resultPLC) => {
                          let FLOAT = resultPLC.response._body._valuesAsArray;

                          let Bufer = Buffer.allocUnsafe(4);
                          Bufer.writeUInt16BE(FLOAT[0], 2);
                          Bufer.writeUInt16BE(FLOAT[1], 0);
                          let ValorR = Bufer.readFloatBE(0).toFixed(2);
                          // Enviar
                          let EnviarDatos = {
                            fecha_hora: Fecha,
                            id_estacion: result[0].Calve_Rasp,
                            nombre_estacion: result[0].Nombre_Estacion,
                            Ip_Publica: result[0].Ip_Publica,
                            Ubicacion: {
                              longitud: result[0].longitud,
                              latitud: result[0].latitud,
                            },
                            Addr: Tipo.Addr,
                            Nombre: Tipo.Nombre,
                            Tipo: Tipo.Tipo,
                            Valor: ValorR,
                            Variable: Tipo.Variable,
                            Descripcion: Tipo.Descripcion,
                            UM: Tipo.UM,
                          };
                          clientMQTT.publish(
                            `${TopicBase}/${Tipo.Nombre}`,
                            JSON.stringify(EnviarDatos),
                            { qos: 0, retain: false },
                            (error) => {
                              if (error) {
                                //console.log("Error al publicar".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.error(
                            "FLOAT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              })
                          );
                        });
                    } else {
                      clientPLC
                        .readHoldingRegisters(Tipo.Addr, 1)
                        .then((resultPLC) => {
                          let LecturaRegistros =
                            resultPLC.response._body._valuesAsArray[0];
                          // Enviar
                          let EnviarDatos = {
                            fecha_hora: Fecha,
                            id_estacion: result[0].Calve_Rasp,
                            nombre_estacion: result[0].Nombre_Estacion,
                            Ip_Publica: result[0].Ip_Publica,
                            Ubicacion: {
                              longitud: result[0].longitud,
                              latitud: result[0].latitud,
                            },
                            Addr: Tipo.Addr,
                            Nombre: Tipo.Nombre,
                            Tipo: Tipo.Tipo,
                            Valor: LecturaRegistros,
                            Variable: Tipo.Variable,
                            Descripcion: Tipo.Descripcion,
                            UM: Tipo.UM,
                          };
                          clientMQTT.publish(
                            `${TopicBase}/${Tipo.Nombre}`,
                            JSON.stringify(EnviarDatos) + "",
                            { qos: 0, retain: false },
                            (error) => {
                              if (error) {
                                //console.log("Error al publicar".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.error(
                            "INT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              })
                          );
                        });
                    }
                  });
                }, result[0].Mqtt_Time);

                setInterval(() => {
                  Fecha = moment()
                    .utcOffset("-06:00")
                    .format("YYYY-MM-DD HH:mm:ss");
                  resultP.map(function (Tipo, index) {
                    if (Tipo.Tipo == "BIT") {
                      clientPLC
                        .readCoils(Tipo.Addr, 1)
                        .then((resultPLC) => {
                          let ValorBoniba =
                            resultPLC.response._body._valuesAsArray[0];
                          // Guardamos
                          ejecutarconsultas(
                            `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                            (error, result) => {
                              if (!error) {
                                //console.log("success ".green);
                              } else {
                                //console.log("Error al ejecutar consulta ".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.log(
                            "BIT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              }),
                            null
                          );
                        });
                    } else if (Tipo.Tipo == "FLOAT") {
                      clientPLC
                        .readCoils(Tipo.Addr, 2)
                        .then((resultPLC) => {
                          let FLOAT = resultPLC.response._body._valuesAsArray;

                          let Bufer = Buffer.allocUnsafe(4);
                          Bufer.writeUInt16BE(FLOAT[0], 2);
                          Bufer.writeUInt16BE(FLOAT[1], 0);
                          let ValorR = Bufer.readFloatBE(0);
                          // Guardamos
                          ejecutarconsultas(
                            `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorR}','${Fecha}');`,
                            (error, result) => {
                              if (!error) {
                                //console.log("success ".green);
                              } else {
                                //console.log("Error al ejecutar consulta ".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.error(
                            "FLOAT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              })
                          );
                        });
                    } else {
                      clientPLC
                        .readHoldingRegisters(Tipo.Addr, 1)
                        .then((resultPLC) => {
                          let LecturaRegistros =
                            resultPLC.response._body._valuesAsArray;
                          // Guardamos
                          ejecutarconsultas(
                            `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${LecturaRegistros}','${Fecha}');`,
                            (error, result) => {
                              if (!error) {
                                //console.log("success ".green);
                              } else {
                                //console.log("Error al ejecutar consulta ".red);
                              }
                            }
                          );
                        })
                        .catch(function () {
                          console.error(
                            "INT " +
                              require("util").inspect(arguments, {
                                depth: null,
                              })
                          );
                        });
                    }
                  });
                }, result[0].Mysql_Time);
              } else {
                console.log("Error al consultar parámetros");
              }
            }
          );
        } else {
          console.log("Error al suscribir");
        }
      });
    });

    clientMQTT.on("message", (topic, message) => {
      //console.log(message);
      message = JSON.parse(message);
      let status = socket.resume()._readableState.destroyed;
      status ? socket.connect(options) : "";
      Fecha = moment().utcOffset("-06:00").format("YYYY-MM-DD HH:mm:ss");
      //console.log(Fecha);
      switch (topic) {
        case `${TopicBase}/WR`:
          if (message.Addr != "" && message.Valor != "") {
            clientPLC
              .writeSingleRegister(message.Addr, message.Valor)
              .then(function (resp) {
                console.log(resp);
                // Guardamos
                ejecutarconsultas(
                  `insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('SE ESCRIBIÓ EN UN REGISTRO','SE ESCRIBIÓ EL VALOR ${message.Addr} EN LA POSICIÓN ${message.Addr}','${Fecha}','${topic}');`,
                  (error, result) => {
                    if (!error) {
                      //console.log("success ".green);
                    } else {
                      //console.log("Error al ejecutar consulta ".red);
                    }
                  }
                );
              })
              .catch(function () {
                console.error(arguments);
              });
          } else {
            console.log("Vació");
          }
          break;
        case `${TopicBase}/on_off`:
          if (message.Addr != "" && message.Accion != "") {
            console.log(message);
            let Addr = parseInt(message.Addr);
            if (message.Accion == "on") {
              clientPLC
                .writeSingleCoil(Addr, true)
                .then((result) => {
                  //console.log("Prender en ", Addr);
                  ejecutarconsultas(
                    `insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('ENCENDIDO DE BOBINA','SE ENCENDIÓ UNA BOBINA EN LA POSITION ${Addr}','${Fecha}','${topic}');`,
                    (error, result) => {
                      if (!error) {
                        //console.log("success ".green);
                      } else {
                        //console.log("Error al ejecutar consulta ".red);
                      }
                    }
                  );
                })
                .catch(() => {
                  console.error(arguments);
                });
            } else if (message.Accion == "off") {
              clientPLC
                .writeSingleCoil(Addr, false)
                .then((result) => {
                  //console.log("Apagar en ", Addr);
                  // Guardamos
                  ejecutarconsultas(
                    `insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('APAGADO DE BOBINA','SE APAGO UNA BOBINA EN LA POSITION ${Addr}','${Fecha}','${topic}');`,
                    (error, result) => {
                      if (!error) {
                        //console.log("success ".green);
                      } else {
                        //console.log("Error al ejecutar consulta ".red);
                      }
                    }
                  );
                })
                .catch(() => {
                  console.error(arguments);
                });
            }
          } else {
            console.log("Vació");
          }
          break;
        case `${TopicBase}/SQL`:
          console.log("mensaje ", message.query);
          if (message.query != "" && message.query != undefined) {
            ejecutarconsultas(message.query, (error, result) => {
              if (!error) {
                // Guardamos
                ejecutarconsultas(
                  `insert into historial_acciones(Nombre,Descripcion,Fecha,Topico) values('COMANDOS SQL','${message.query}','${Fecha}','${topic}');`,
                  (errorI, resultI) => {
                    if (!errorI) {
                      clientMQTT.publish(
                        `${TopicBase}/SQL/Result`,
                        JSON.stringify(result),
                        { qos: 0, retain: false },
                        (errorP) => {
                          if (!errorP) {
                            if (message.query.includes("UPDATE")) {
                              setTimeout(() => {
                                throw "Reiniciar API por actualización de la BD";
                              }, 250);
                            }
                          }
                        }
                      );
                    }
                  }
                );
              }
            });
          }
          break;
      }
    });

    clientMQTT.on("reconnect", () => {
      console.log("Reconectando al broker de CGR "), mqttURL;
      ejecutarconsultas(
        "select*from parametros order by Tipo,Nombre asc",
        (error, resultP) => {
          if (!error) {
            setInterval(() => {
              Fecha = moment()
                .utcOffset("-06:00")
                .format("YYYY-MM-DD HH:mm:ss");
              resultP.map(function (Tipo, index) {
                if (Tipo.Tipo == "BIT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let ValorBoniba =
                        resultPLC.response._body._valuesAsArray[0];
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.log(
                        "BIT " +
                          require("util").inspect(arguments, { depth: null }),
                        null
                      );
                    });
                } else if (Tipo.Tipo == "FLOAT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 2)
                    .then((resultPLC) => {
                      let FLOAT = resultPLC.response._body._valuesAsArray;
                      let Bufer = Buffer.allocUnsafe(4);
                      Bufer.writeUInt16BE(FLOAT[0], 2);
                      Bufer.writeUInt16BE(FLOAT[1], 0);
                      let ValorR = Bufer.readFloatBE(0);
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorR}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "FLOAT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                } else {
                  clientPLC
                    .readHoldingRegisters(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let LecturaRegistros =
                        resultPLC.response._body._valuesAsArray;
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${LecturaRegistros}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "INT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                }
              });
            }, result[0].Mysql_Time);
          } else {
            console.log("Error al consultar parámetros");
          }
        }
      );
    });

    clientMQTT.on("error", () => {
      console.log("ERROR AL CONECTAR AL CONECTAR AL BROKER DE CGR ", mqttURL);
      ejecutarconsultas(
        "select*from parametros order by Tipo,Nombre asc",
        (error, resultP) => {
          if (!error) {
            setInterval(() => {
              Fecha = moment()
                .utcOffset("-06:00")
                .format("YYYY-MM-DD HH:mm:ss");
              resultP.map(function (Tipo, index) {
                if (Tipo.Tipo == "BIT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let ValorBoniba =
                        resultPLC.response._body._valuesAsArray[0];
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.log(
                        "BIT " +
                          require("util").inspect(arguments, { depth: null }),
                        null
                      );
                    });
                } else if (Tipo.Tipo == "FLOAT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 2)
                    .then((resultPLC) => {
                      let FLOAT = resultPLC.response._body._valuesAsArray;
                      let Bufer = Buffer.allocUnsafe(4);
                      Bufer.writeUInt16BE(FLOAT[0], 2);
                      Bufer.writeUInt16BE(FLOAT[1], 0);
                      let ValorR = Bufer.readFloatBE(0);
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorR}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "FLOAT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                } else {
                  clientPLC
                    .readHoldingRegisters(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let LecturaRegistros =
                        resultPLC.response._body._valuesAsArray;
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${LecturaRegistros}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "INT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                }
              });
            }, result[0].Mysql_Time);
          } else {
            console.log("Error al consultar parámetros");
          }
        }
      );
    });

    clientMQTT.on("offline", () => {
      console.log(
        "Revisa tu conexión a internet, no se puede conectar a CGR ",
        mqttURL
      );
      ejecutarconsultas(
        "select*from parametros order by Tipo,Nombre asc",
        (error, resultP) => {
          if (!error) {
            setInterval(() => {
              Fecha = moment()
                .utcOffset("-06:00")
                .format("YYYY-MM-DD HH:mm:ss");
              resultP.map(function (Tipo, index) {
                if (Tipo.Tipo == "BIT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let ValorBoniba =
                        resultPLC.response._body._valuesAsArray[0];
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorBoniba}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.log(
                        "BIT " +
                          require("util").inspect(arguments, { depth: null }),
                        null
                      );
                    });
                } else if (Tipo.Tipo == "FLOAT") {
                  clientPLC
                    .readCoils(Tipo.Addr, 2)
                    .then((resultPLC) => {
                      let FLOAT = resultPLC.response._body._valuesAsArray;
                      let Bufer = Buffer.allocUnsafe(4);
                      Bufer.writeUInt16BE(FLOAT[0], 2);
                      Bufer.writeUInt16BE(FLOAT[1], 0);
                      let ValorR = Bufer.readFloatBE(0);
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${ValorR}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "FLOAT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                } else {
                  clientPLC
                    .readHoldingRegisters(Tipo.Addr, 1)
                    .then((resultPLC) => {
                      let LecturaRegistros =
                        resultPLC.response._body._valuesAsArray;
                      // Guardamos
                      ejecutarconsultas(
                        `insert into historial(Id_Parametro,Valor,Fecha) values('${Tipo.Id}','${LecturaRegistros}','${Fecha}');`,
                        (error, result) => {
                          if (!error) {
                            //console.log("success ".green);
                          } else {
                            //console.log("Error al ejecutar consulta ".red);
                          }
                        }
                      );
                    })
                    .catch(function () {
                      console.error(
                        "INT " +
                          require("util").inspect(arguments, { depth: null })
                      );
                    });
                }
              });
            }, result[0].Mysql_Time);
          } else {
            console.log("Error al consultar parámetros");
          }
        }
      );
    });
    clientMQTT.on("disconnect", () => {
      console.log("desconectado a CGR ", mqttURL);
    });
    /*----------------------------------------------------------------------------------------------------------------------------------------------------------------------\
|                                                                               MQTT ORGANISMO OPERADOR                                                                            |
\----------------------------------------------------------------------------------------------------------------------------------------------------------------------*/
    const MqttOperador = `tcp://${result[0].Host_Operador_Mqtt}:${result[0].Port_Operador_Mqtt}`;
    const connectMqttOperador = mqtt.connect(MqttOperador);
    connectMqttOperador.on("connect", () => {
      console.log("Conectado al broker del operador");
      connectMqttOperador.subscribe(
        `${result[0].Topico_Operador_Mqtt}/#`,
        (err) => {
          if (!err) {
            // Valida que el aun se encuentre la conecxion del plc
            let status = socket.resume()._readableState.destroyed;
            status ? socket.connect(options) : "";
            //console.log(" MQTT ORGANISMO OPERADOR ",TopicBase)
            ejecutarconsultas(
              "select*from parametros where Permisos='S' order by Tipo asc",
              (error, resultP) => {
                Fecha = moment()
                  .utcOffset("-06:00")
                  .format("YYYY-MM-DD HH:mm:ss");
                if (!error) {
                  setInterval(() => {
                    resultP.map(function (Tipo, index) {
                      if (Tipo.Tipo == "BIT") {
                        clientPLC
                          .readCoils(Tipo.Addr, 1)
                          .then((resultPLC) => {
                            let ValorBoniba =
                              resultPLC.response._body._valuesAsArray[0];
                            // Enviar
                            let EnviarDatos = {
                              Ip_Publica: result[0].Ip_Publica,
                              Ubicacion: {
                                longitud: result[0].longitud,
                                latitud: result[0].latitud,
                              },
                              fecha_hora: Fecha,
                              id_estacion: "184",
                              nombre_estacion: result[0].Nombre_Estacion,
                              Descripcion: Tipo.Nombre,
                              Valor: ValorBoniba,
                            };
                            connectMqttOperador.publish(
                              `${result[0].Topico_Operador_Mqtt}`,
                              JSON.stringify(EnviarDatos),
                              { qos: 0, retain: false },
                              (error) => {
                                if (error) {
                                  console.log(
                                    "Error al publicar a MQTT ORGANISMO OPERADOR"
                                      .red
                                  );
                                } else {
                                  console.log("envió de información");
                                }
                              }
                            );
                          })
                          .catch(function () {
                            console.log(
                              "BIT " +
                                require("util").inspect(arguments, {
                                  depth: null,
                                }),
                              null
                            );
                          });
                      } else if (Tipo.Tipo == "FLOAT") {
                        clientPLC
                          .readCoils(Tipo.Addr, 2)
                          .then((resultPLC) => {
                            let FLOAT = resultPLC.response._body._valuesAsArray;

                            let Bufer = Buffer.allocUnsafe(4);
                            Bufer.writeUInt16BE(FLOAT[0], 2);
                            Bufer.writeUInt16BE(FLOAT[1], 0);
                            let ValorR = Bufer.readFloatBE(0);
                            // Enviar
                            let EnviarDatos = {
                              Ip_Publica: result[0].Ip_Publica,
                              Ubicacion: {
                                longitud: result[0].longitud,
                                latitud: result[0].latitud,
                              },
                              fecha_hora: Fecha,
                              id_estacion: "184",
                              nombre_estacion: result[0].Nombre_Estacion,
                              Descripcion: Tipo.Nombre,
                              Valor: ValorR,
                            };
                            connectMqttOperador.publish(
                              `${result[0].Topico_Operador_Mqtt}`,
                              JSON.stringify(EnviarDatos),
                              { qos: 0, retain: false },
                              (error) => {
                                if (error) {
                                  console.log(
                                    "Error al publicar a MQTT ORGANISMO OPERADOR"
                                      .red
                                  );
                                }
                              }
                            );
                          })
                          .catch(function () {
                            console.error(
                              "FLOAT " +
                                require("util").inspect(arguments, {
                                  depth: null,
                                })
                            );
                          });
                      } else {
                        clientPLC
                          .readHoldingRegisters(Tipo.Addr, 1)
                          .then((resultPLC) => {
                            let LecturaRegistros =
                              resultPLC.response._body._valuesAsArray[0];
                            // Enviar
                            let EnviarDatos = {
                              Ip_Publica: result[0].Ip_Publica,
                              Ubicacion: {
                                longitud: result[0].longitud,
                                latitud: result[0].latitud,
                              },
                              fecha_hora: Fecha,
                              id_estacion: "184",
                              nombre_estacion: result[0].Nombre_Estacion,
                              Descripcion: Tipo.Nombre,
                              Valor: LecturaRegistros,
                            };
                            connectMqttOperador.publish(
                              `${result[0].Topico_Operador_Mqtt}`,
                              JSON.stringify(EnviarDatos) + "",
                              { qos: 0, retain: false },
                              (error) => {
                                if (error) {
                                  console.log(
                                    "Error al publicar a MQTT ORGANISMO OPERADOR"
                                      .red
                                  );
                                }
                              }
                            );
                          })
                          .catch(function () {
                            console.error(
                              "INT " +
                                require("util").inspect(arguments, {
                                  depth: null,
                                })
                            );
                          });
                      }
                    });
                  }, result[0].Mqtt_Time_Operador);
                } else {
                  console.log("Error al consultar");
                }
              }
            );
          } else {
            console.log("Error al suscribirse");
          }
        }
      );
    });

    connectMqttOperador.on("reconnect", () => {
      console.log("Reconectando al broker operador ", MqttOperador);
    });

    connectMqttOperador.on("error", () => {
      console.log("ERROR AL CONECTAR AL BROKER OPERADOR ", MqttOperador);
    });

    connectMqttOperador.on("offline", () => {
      console.log(
        "Revisa tu conexión a internet, no se pudo conectar al broker operador ",
        MqttOperador
      );
    });
    connectMqttOperador.on("disconnect", () => {
      console.log("desconectado del broker operador ", MqttOperador);
    });
  } else {
    console.log("Error al consultar la base de datos ");
  }
});

setInterval(() => {
  throw "Reiniciar API ".green;
}, 300000);
