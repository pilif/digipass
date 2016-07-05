import STORES from './stores';
import url from './urltemplate';

const ORDER_RE = /https?:\/\/www.digitec.ch\/([a-z]{2})\/Order\/(\d+)\s+/;
const STORE_RE = /https?:\/\/www.digitec.ch\/[a-z]{2}\/Site\/(\d+)\s+/;

export default class BodyParser {
    constructor(body){
        this.body = body;
        this.coords = this.oid = this.lang = null;
    }

    getOid(){
        if (this.oid) return this.oid;
        [,this.lang, this.oid] =
            (this.body.match(ORDER_RE) || []);

        return this.oid;
    }

    getLanguage(){
        if (this.lang) return this.lang;
        [,this.lang, this.oid]
            = (this.body.match(ORDER_RE) || []);
        return this.lang;
    }

    getStore(){
        if (this.coords) return this.coords;
        const m = this.body.match(STORE_RE);
        if (!m) return null;

        this.coords = STORES.get(parseInt(m[1], 10));
        return this.coords;
    }

    getOrderUrl(){
        return url`https://www.digitec.ch/${this.getLanguage()}/Order/${this.getOid()}`
    }
}

