
import express from "express";
import http, { Server } from "http";
import { AddressInfo, ListenOptions, Socket } from "net";
// import https from "https";

const CONNECTION_TRY_TIME: number   = 3000;
const MAX_TRY_CONNECTION: number    = 100;

export default class HttpServer {

    /**
     * Геттер port
     *
     * @public
     * @getter
     * @this HttpServer
     * @returns {number}
     */
    get port() {
        return this.serverPort;
    }

    private readonly serverPort: number;
    private httpServer: Server;
    private ipTables: any;

    /**
     * Constructor
     * 
     * @public
     * @this HttpServer
     */
    public constructor(expressApp: express.Application, port: number = 25565) {
        this.serverPort = port;
        this.ipTables = {};
        this.httpServer = http.createServer(expressApp);
    }

    /**
     * Запуск веб-сервера
     * 
     * @public
     * @this HttpServer
     */
    public run() {
        const options: ListenOptions = {
            host: "0.0.0.0",
            port: this.serverPort,
        };

        // Начинаем слушать порт <-- здесь нужно поменять на отдельные инстансы Input
        this.httpServer.listen(options, () => {
            console.log("HTTP-Server run on port: " + this.serverPort);
        });

        // checkDDOS
        this.httpServer.on("connection", (socket: Socket) => {
            this.checkDdos(socket);
        });

        this.httpServer.on("error", (err: Error) => {
            if (err) {
                throw new Error(err.message);
            }
        });
    }

    /**
     * CheckDDoS
     * 
     * @private
     * @this HttpServer
     * @param {Socket} socket
     */
    private checkDdos(socket: Socket) {
        const socketAddress: string | AddressInfo   = socket.address();
        const timeNow: number                       = Date.now();
        let ip: string                              = "";

        if (typeof(socketAddress) === "string") {
            ip = socketAddress;
        } else {
            ip = socketAddress.address;
        }
        
        if (ip in this.ipTables) {
            const { time } = this.ipTables[ip];

            if (time) {
                // Если прошло слишком много времени на повторное подключение
                if (timeNow - time > CONNECTION_TRY_TIME) {
                    this.ipTables[ip] = {
                        count: 1,
                        time: timeNow,
                    };
                    return;
                } 

                // Если прошло слишком МАЛО времени на повторное подключение
                this.ipTables[ip].count++;
                this.ipTables[ip].time = timeNow;
                if (this.ipTables[ip].count > MAX_TRY_CONNECTION) {
                    socket.end(`HTTP/1.1 429 Too Many Requests\n\n`);
                    socket.destroy();
                }
            }
        } else {
            this.ipTables[ip] = {
                count: 1,
                time: timeNow,
            };
        }
    }
}
