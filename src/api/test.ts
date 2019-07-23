import Api from "../Api";

export default class TestApi extends Api {

    public constructor() {
        super(__filename);
    }
    
    /**
     * Тело выполнения запроса
     * 
     * @public
     * @async
     * @param {object} data
     * @returns {object}
     * @override
     */
    public async process(data?: object) {
        return { result: "true" };
    }
}
