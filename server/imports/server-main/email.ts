/// <reference types="node" />

import {languages} from "../languages/languages";
import { Email } from 'meteor/email';

import * as _ from 'lodash';
import * as moment from 'moment';
import {TokenCollection} from "../../../both/collections/token.collection";

export function findLanguage(language) {
    language = language.toLowerCase().replace('-', '_');
    if (languages.hasOwnProperty(language)) {
        return languages[language];
    }
    let idx = language.indexOf('_');
    if (idx !== -1) {
        return findLanguage(language.substring(0, idx));
    }
    return 'en';
}

export function isUsingEmail() {
    return !!process.env.MAIL_URL;
}

const _titleRe = /<title[^>]*>([^<]*)<\/title>/ig;
function extractTitle(message: string) {
    let titleResult = _titleRe.exec(message);
    if (titleResult) {
        return titleResult[1];
    }
    return "";
}

function renderTemplate(language: string, templateName: string, replacements: {[key: string]: string}) {
    let lang = findLanguage(language);
    let html = Assets.getText(`email/${lang}/${templateName}.html`);
    let text = Assets.getText(`email/${lang}/${templateName}.txt`);
    _.forEach(_.toPairs(replacements), replacement => {
        html = html.split("{{" + replacement[0] + "}}").join(replacement[1]);
        text = text.split("{{" + replacement[0] + "}}").join(replacement[1]);
    });
    return {
        html: html,
        text: text,
        title: extractTitle(html)
    };
}

export function sendPasswordReset(userId: string, language: string, address: string) {
    let token = Random.hexString(32);
    TokenCollection.insert({
        token: token,
        type: 'password',
        created: new Date(),
        expiresAt: moment().add(2, "d").toDate(),
        userId: userId
    });
    let data = renderTemplate(language, 'reset-password', {resetUrl: process.env.BASE_URL + '/reset-password/' + token});
    Email.send({
        from: process.env.MAIL_FROM,
        to: address,
        text: data.text,
        html: data.html,
        subject: data.title
    });
}

export function sendAddressVerification(userId: string, language: string, address: string) {
    let token = Random.hexString(32);
    TokenCollection.insert({
        token: token,
        type: 'email',
        created: new Date(),
        expiresAt: moment().add(2, "d").toDate(),
        userId: userId,
        emailAddress: address
    });
    let data = renderTemplate(language, 'verify-email', {verificationUrl: process.env.BASE_URL + '/verify-email/' + token});
    Email.send({
        from: process.env.MAIL_FROM,
        to: address,
        text: data.text,
        html: data.html,
        subject: data.title
    });
}
