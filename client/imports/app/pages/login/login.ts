import { Component, OnInit } from "@angular/core";
import template from "./login.html";
import style from "./login.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AlertController, NavParams, ToastController} from "ionic-angular";
import * as _ from 'lodash';
import {TranslateHelperService} from "../../services/translate-helper";
import {TranslateService} from "../../services/translate";

@Component({
    selector: "login-page",
    template: template,
    styles: [ style ]
})
export class LoginPage {
    public loginForm: FormGroup;

    public hadInvalidPassword: boolean = false;
    public hadInvalidEmail: boolean = false;

    constructor(private fb: FormBuilder, private toastCtrl: ToastController,
                private translateHelper: TranslateHelperService, private alert: AlertController,
                private params: NavParams, private translate: TranslateService) {
        this.loginForm = fb.group({
            emailOrUsername: [params.get('user')||"", Validators.required],
            password: ["", Validators.required]
        });
    }

    doLogin() {
        if (!this.loginForm.valid) {
            return;
        }
        let emailOrUsername = this.loginForm.controls['emailOrUsername'].value;
        let password = this.loginForm.controls['password'].value;
        console.log("Email/Username: ", emailOrUsername);
        Meteor.loginWithPassword(emailOrUsername, password, (err) => {
            if (err) {
                if (err.error === 'user-email-not-verified') {
                    this.hadInvalidEmail = true;
                } else {
                    this.hadInvalidPassword = true;
                }
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            }
        });
    }

    showResendEmail(initialEmail) {
        this.alert.create({
            title: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_REQUEST.TITLE'),
            message: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_REQUEST.MESSAGE'),
            inputs: [
                {
                    placeholder: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_REQUEST.EMAIL_OR_USERNAME'),
                    type: 'text',
                    value: initialEmail,
                    name: 'emailOrUsername'
                }
            ],
            buttons: [
                {
                    text: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_REQUEST.CANCEL'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_REQUEST.OK'),
                    handler: (data) => {
                        this.resendVerificationMail(data.emailOrUsername);
                    }
                },
            ]
        }).present();
    }

    showForgotPassword() {
        this.alert.create({
            title: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_REQUEST.TITLE'),
            message: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_REQUEST.MESSAGE'),
            inputs: [
                {
                    placeholder: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_REQUEST.EMAIL_OR_USERNAME'),
                    type: 'text',
                    value: this.loginForm.controls['emailOrUsername'].value,
                    name: 'emailOrUsername'
                }
            ],
            buttons: [
                {
                    text: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_REQUEST.CANCEL'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_REQUEST.OK'),
                    handler: (data) => {
                        this.forgotPassword(data.emailOrUsername);
                    }
                },
            ]
        }).present();
    }

    forgotPassword(emailOrUsername) {
        Meteor.call('users.forgotPassword', {emailOrUsername}, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
                if (err.reason === 'no-valid-email') {
                    this.showResendEmail(emailOrUsername);
                }
            } else {
                this.alert.create({
                    title: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_SUCCESS.TITLE'),
                    message: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_SUCCESS.MESSAGE'),
                    buttons: [
                        {
                            text: this.translate.get('LOGIN_PAGE.PASSWORD_RESET_SUCCESS.OK'),
                            role: 'cancel'
                        }
                    ]
                }).present();
            }
        });
    }

    resendVerificationMail(emailOrUsername) {
        Meteor.call('users.resendEmailVerification', {emailOrUsername}, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                this.alert.create({
                    title: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_SUCCESS.TITLE'),
                    message: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_SUCCESS.MESSAGE'),
                    buttons: [
                        {
                            text: this.translate.get('LOGIN_PAGE.RESEND_EMAIL_SUCCESS.OK'),
                            role: 'cancel'
                        }
                    ]
                })
            }
        });
    }
}
