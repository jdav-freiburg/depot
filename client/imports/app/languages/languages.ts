import {MissingTranslationHandler, MissingTranslationHandlerParams, TranslateLoader} from "@ngx-translate/core";
import {Observable} from "rxjs/Observable";

import * as _ from 'lodash';

import {de} from "./de";
import {en} from "./en";

export const languages = {
    de,
    en
};

export class StaticTranslateLoader implements TranslateLoader {
    getTranslation(lang: string): Observable<any> {
        if (_.has(languages, lang)) {
            return Observable.of(languages[lang]);
        }
        return null;
    }
}

export class LogMissingTranslationHandler implements MissingTranslationHandler {
    handle(params: MissingTranslationHandlerParams) {
        console.log("Missing translation for", params.key);
        return params.key;
    }
}