import {ApplicationRef, Injectable} from "@angular/core";

import * as _ from 'lodash';
import * as moment from 'moment';

import {languages} from "../languages/languages";
import {Platform} from "ionic-angular";

interface Translatable {
    translate: string;
    text: string;
}

@Injectable()
export class TranslateService {
    private languages = languages;

    private language: any;
    private _languageKey: string;

    constructor(private app: ApplicationRef, public platform: Platform) {
        this.language = this.languages.en;

        _.forIn(this.languages, (language, name) => {
            if (_.has(language, "moment")) {
                moment.locale(name, _.get(language, "moment"));
            }
        });
        moment.locale('en');

        this.setDefaultLanguage(true);
    }

    public set languageKey(language: string) {
        this.setLanguage(language);
    }

    public get languageKey(): string {
        return this._languageKey;
    }

    public setDefaultLanguage(noTick?: boolean) {
        let userLang = navigator.language || (<any>navigator).userLanguage;
        this.setLanguage(userLang, noTick);
    }

    public setLanguage(language: string, noTick?: boolean): void {
        console.log("Trying to set language to", language);
        if (this.trySetLanguage(language, noTick)) {
            moment.locale(language);
            this.platform.setLang(language, true);
        }
    }

    private trySetLanguage(language: string, noTick?: boolean): boolean {
        language = language.replace('-', '_').toLowerCase();
        if (_.has(this.languages, language)) {
            this.language = _.get(this.languages, language);
            this._languageKey = language;
            console.log("Changed language to", language);
            if (!noTick) {
                this.app.tick();
            }
            return true;
        } else if (language.indexOf('_') !== -1) {
            return this.trySetLanguage(language.substring(0, language.indexOf('_')), noTick);
        }
        return false;
    }

    public has(path: string): boolean {
        return _.has(this.language, path);
    }

    public get(path: string, data?: any): string {
        let obj = _.get(this.language, path);
        if (_.isString(obj)) {
            return obj;
        }
        if (_.isFunction(obj)) {
            let res = obj.call(null, data);
            if (!_.isString(res)) {
                throw new Error("Expected string result from translator for " + path);
            }
            return res;
        }
        throw new Error("Expected string or function in translation for " + path);
    }

    public getAll<T extends Translatable>(translatables: T[], data?: any, cloneValue?: boolean): T[] {
        if (_.isUndefined(cloneValue)) {
            cloneValue = true;
        }
        if (cloneValue) {
            return _.map(translatables, translatable => <T>_.extend({}, translatable, {text: this.get(translatable.translate, data)}));
        }
        _.forEach(translatables, translatable => translatable.text = this.get(translatable.translate, data));
        return translatables;
    }
}
