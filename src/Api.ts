import { timeout } from "./time";

const BASE_API_DIRECTORY = `${__dirname}\\api\\`;
const API_TIMEOUT = 20000;

export default class Api {

    /**
     * Статический метод проверки является ли данный класс или его потомок API-методом
     * 
     * @public
     * @static
     * @this Api
     * @returns {boolean}
     */
    public static isApi(): boolean {
        return true;
    }

    protected _start: number;
    protected ip: string | string[] | undefined;
    protected params: object;
    private apiName: string;
    

    /**
     * Constructor
     * 
     * @public
     * @this Api
     */
    public constructor(fileName: string) {
        if (!fileName.startsWith(BASE_API_DIRECTORY)) {
            throw new Error("Invalid api directory " + fileName + "\n" + BASE_API_DIRECTORY);
        }

        let tt: string = fileName.substr(BASE_API_DIRECTORY.length);
        tt = tt.substr(0, tt.length - 3);
        this.apiName = tt.replace(/\//g, ".");

        this._start = Date.now();
        this.ip     = "";
        this.params = {};
    }

    /**
     * Установка значения ip
     * 
     * @public
     * @this Api
     * @param {string | string[] | undefined} ip
     * @returns {void}
     */
    public setIp(ip: string | string[] | undefined): void {
        this.ip = ip;
    }

    /**
     * Установка значений params
     * 
     * @public
     * @this Api
     * @param {object} params
     * @returns {void}
     */
    public setParams(params: object): void {
        this.params = params;
    }

    /**
     * Функция обработки вызова API-метода
     * 
     * @public
     * @async
     */
    public async callProcess() {
        let result: any = {};

        try {
            result = await Promise.race([timeout(API_TIMEOUT), this.process(this.params || {})]);
        } catch (e) {
            throw new Error(e);
        }

        return {
            response: result === undefined ? {} : result,
        };
    }

    /**
     * Виртуальное тело метода
     * @public
     * @virtual
     * @param {object} data
     * @returns {void}
     */
    public process(data?: object): void {
        throw new Error("Try to call virtual method");
    }
}
