import { Component } from "@angular/core";
import template from "./verify-email.html";
import style from "./verify-email.scss";
import {AlertController, NavParams, ToastController, ViewController} from "ionic-angular";
import * as _ from 'lodash';
import {TranslateHelperService} from "../../services/translate-helper";
import {TranslateService} from "../../services/translate";
import {Location} from "@angular/common";

@Component({
    selector: "verify-email-page",
    template: template,
    styles: [ style ]
})
export class VerifyEmailPage {
    constructor(private toastCtrl: ToastController, private params: NavParams,
                private translateHelper: TranslateHelperService, private alert: AlertController,
                private viewCtrl: ViewController, private translate: TranslateService,
                private location: Location) {
    }

    verifyEmail() {
        Meteor.call('users.validateEmailToken', {token: this.params.get('token')}, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                this.alert.create({
                    title: this.translate.get('VERIFY_EMAIL_PAGE.SUCCESS.TITLE'),
                    message: this.translate.get('VERIFY_EMAIL_PAGE.SUCCESS.MESSAGE'),
                    buttons: [
                        {
                            text: this.translate.get('VERIFY_EMAIL_PAGE.SUCCESS.OK'),
                            role: 'cancel',
                            handler: () => {
                                this.viewCtrl.dismiss();
                                //this.location.go('/');
                                //window.location.href = "/";
                            }
                        }
                    ]
                }).present();
            }
        });
    }
}
