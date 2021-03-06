import {ApplicationRef, Injectable} from "@angular/core";

import * as _ from 'lodash';
import * as moment from 'moment';

import {languages, languages_alias} from "../languages/languages";
import {Platform} from "ionic-angular";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

export interface Translatable {
    translate: string;
    text: string;
}

export interface LanguageOption {
    titleLong: string;
    titleShort: string;
    name: string;
    active: boolean;
}

export interface TranslateOption extends Translatable {
    value: string;
    color: string;
    colorCss: string;
}

@Injectable()
export class TranslateService {
    private _languages = languages;
    private _languagesAll = _.extend({}, languages, languages_alias);

    private _language: any;
    private _languageKey: string;

    public readonly languageKeyChange: Subject<string> = new BehaviorSubject<string>("en");

    constructor(private app: ApplicationRef, private platform: Platform) {
        this._language = this._languages.en_us;

        _.forIn(this._languages, (language, name) => {
            if (_.has(language, "moment")) {
                moment.locale(name.replace('_', '-'), _.get(language, "moment"));
            }
        });
        moment.locale('en');
    }

    public set languageKey(language: string) {
        this.setLanguage(language);
    }

    public get languageKey(): string {
        return this._languageKey;
    }

    public get languages(): LanguageOption[] {
        let result: LanguageOption[] = [];
        _.forIn(this._languages, (language, name) => {
            if (language['TITLE_LONG'] && language['TITLE_SHORT']) {
                result.push({
                    titleLong: language.TITLE_LONG,
                    titleShort: language.TITLE_SHORT,
                    name: name,
                    active: language === this._language
                });
            }
        });
        return result;
    }

    public setLanguage(language: string, noTick?: boolean): void {
        if (language === this._languageKey) {
            return;
        }
        console.log("Trying to set language to", language);
        if (this.trySetLanguage(language, noTick)) {
            moment.locale(language.replace('_', '-'));
            this.platform.setLang(language, true);
        }
    }

    private trySetLanguage(language: string, noTick?: boolean): boolean {
        language = language.replace('-', '_').toLowerCase();
        if (language === this._languageKey) {
            return;
        }
        if (_.has(this._languagesAll, language)) {
            this._language = _.get(this._languagesAll, language);
            this._languageKey = language;
            console.log("Changed language to", language);
            if (!noTick) {
                this.app.tick();
            }
            this.languageKeyChange.next(language);
            return true;
        } else if (language.indexOf('_') !== -1) {
            return this.trySetLanguage(language.substring(0, language.indexOf('_')), noTick);
        }
        return false;
    }

    public has(path: string|string[]): boolean {
        return _.has(this._language, path);
    }

    public get(path: string|string[], data?: any): string {
        let obj = _.get(this._language, path);
        if (_.isString(obj)) {
            return obj;
        }
        if (_.isFunction(obj)) {
            try {
                let res = obj.call(null, data);
                if (_.isString(res)) {
                    return res;
                }
                console.error("Expected string result from translator for", path);
            } catch(err) {
                console.error(err);
            }
        }
        console.error("No language entry in " + this.languageKey + " for", path);
        if (_.isArray(path)) {
            return _.join(path, '.');
        }
        return path;
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
