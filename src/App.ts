/**
 * App (singleton)
 * Главный класс приложения
 */
import * as cors from "cors";
import express from "express";
import jade, { JadeOptions } from "jade";
import path from "path";
import walk, { Walker } from "walk";
import HttpServer from "./HttpServer";

class App {
    private static _instance: App;
    private _app: express.Application;
    private httpServer: HttpServer | null;
    private readonly _port: number;
    private _api: any;
    private terminating: boolean;
    private readonly clientVersion: string;
    private readonly serverVersion: string;

    /**
     * Constructor
     * 
     * @private
     * @this App
     */
    private constructor() {
        this._app               = express();
        this._port              = 25565;
        this._api               = {};
        this.clientVersion      = "";
        this.serverVersion      = "";
        this.terminating        = false;
        this.httpServer         = null;
    }

    /**
     * Instance (Экземпляр App-класса)
     * 
     * @public
     * @static
     * @getter
     * @this App
     * @returns {App}
     */
    public static get Instance(): App {
        return this._instance || (this._instance = new this());
    }

    /**
     * Запуск веб-сервера
     * 
     * @public
     * @this App
     * @returns {void}
     */
    public run(): void {
        console.info("Application starting...");
        this.initApi();

        // GET-method for game canvas (HTML5 webgl)
        this._app.get("/game/canvas", (req, res) => {
            const ip: string | string[] | undefined     = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
            const data: JadeOptions                     = {
                name: "leoska",
            };

            res.send(jade.renderFile("./public/vk/jade/index.jade", data));
        });

        // Обработка (ALL-METHOD) POST-запросов классами API
        this._app.all("/api/:apiName.json", (req, res) => {
            // req.headers["x-forwarded-for"] <-- этот заголовок обычно вкладывается NGINX'ом
            const ip: string | string[] | undefined = req.headers["x-forwarded-for"] || req.connection.remoteAddress;

            this.handleRequest(req.params.apiName, req.body, ip).then((data: any) => {
                res.json(data);
            }, (err: Error) => {
                console.error(`Request failed ${err}`);

                res.status(500);
                res.end("Internal error");
            });
        });

        // Создаем инстант http-сервера
        this.httpServer = new HttpServer(this._app);

        // Запускаем http-сервер
        this.httpServer.run();
    }

    /**
     * Остановка приложения веб-сервера
     * 
     * @public
     * @async
     * @this App
     */
    public async stop() {
        this.terminating = true;
    }

    /**
     * Инициализация API-методов
     * 
     * @private
     * @this App
     * @returns {any}
     */
    private initApi(): any {
        return new Promise((resolve, reject) => {
            const apiRoot: string   = path.join(__dirname, "api");
            const walker: Walker    = walk.walk(apiRoot);

            walker.on("file", (root, fileStats, next) => {
                if (/^[^_].*\.js$/.test(fileStats.name)) {
                    const apiPath = root.substr(apiRoot.length + 1).replace(/\//g, ".");
                    const apiName = (apiPath ? apiPath + "." : "") + fileStats.name.substr(0, fileStats.name.length - 3);

                    const apiModule = require(path.join(root, fileStats.name)).default;

                    if (apiModule.isApi && apiModule.isApi()) {
                        this._api[apiName] = apiModule;
                    }
                }

                next();
            });

            walker.on("errors", (err) => {
                reject(new Error(`WALKER_FAILED: ${err}`));
            });

            walker.on("end", () => {
                resolve();
            });
        });
    }

    /**
     * Обработка POST API запросов
     * 
     * @private
     * @async
     * @this App
     * @param {string} apiName
     * @param {object} reqBody
     * @param {string | string[] | undefined} ip
     */
    private async handleRequest(apiName: string, reqBody: object, ip: string | string[] | undefined) {
        // Если сервер останавливает работу
        if (this.terminating) {
            return {
                error: {
                    code: "SERVER_TERMINATING",
                },
            };
        }

        try {
            return await this.buildRequest(apiName, reqBody, ip);
        } catch (e) {
            return {
                error: {
                    code: e ? e.code || e.message : "EMPTY_CODE",
                },
            };
        }
    }

    /**
     * Вспомогательная функция для построения API-запроса
     * 
     * @private
     * @async
     * @this App
     * @param {string} apiName
     * @param {object} reqBody
     * @param {string | string[] | undefined} ip
     */
    private async buildRequest(apiName: string, reqBody: object, ip: string | string[] | undefined) {
        const api = this._api[apiName];

        if (!api) {
            throw new Error("API NOT FOUND!");
        }

        const apiInstance = new api();
        apiInstance.setIp(ip);
        apiInstance.setParams(reqBody);

        return await apiInstance.callProcess();
    }
}

const app = App.Instance;
export { app };
