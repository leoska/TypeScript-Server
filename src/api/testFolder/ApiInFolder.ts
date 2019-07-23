import Api from "../../Api";

export default class ApiInFolder extends Api {

    public constructor() {
        super(__filename);
    }

    public async process() {
        return true;
    }
}
