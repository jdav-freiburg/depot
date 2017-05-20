import {Injectable} from "@angular/core";

import * as _ from 'lodash';

import {AlertController, Platform} from "ionic-angular";
import {UserService} from "./user";
import {TranslateService} from "./translate";

@Injectable()
export class TranslateHelperService {

    constructor(private user: UserService, private translate: TranslateService, private alert: AlertController) {
        this.setDefaultLanguage(true);
        this.translate.languageKeyChange.subscribe((newLanguageKey) => {
            if (this.user.user && this.user.user.language !== newLanguageKey) {
                this.user.setLanguage(newLanguageKey);
            }
        });
        this.user.userChange.subscribe(() => {
            if (user.user && user.user.language) {
                this.setDefaultLanguage();
            }
        });
    }

    public setDefaultLanguage(noTick?: boolean) {
        let userLang;
        if (this.user.user && this.user.user.language) {
            userLang = this.user.user.language;
        } else {
            userLang = navigator.language || (<any>navigator).userLanguage;
        }
        this.translate.setLanguage(userLang, noTick);
    }

    public getError(error: Meteor.Error) {
        return this.translate.has(['ERROR', error.reason])?this.translate.get(['ERROR', error.reason]):this.translate.get('ERROR.GENERAL', error);
    }

    public showLanguageSelect(): void {
        this.alert.create({
            inputs: _.map(this.translate.languages, (language) => {
                return {
                    type: 'radio',
                    label: language.titleLong,
                    value: language.name,
                    checked: language.active
                };
            }),
            title: this.translate.get('LANGUAGE_SELECT.TITLE'),
            buttons: [
                {
                    text: this.translate.get('LANGUAGE_SELECT.CANCEL'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('LANGUAGE_SELECT.OK'),
                    handler: (data) => {
                        this.translate.languageKey = data;
                    }
                }
            ]
        }).present();
    }
}
