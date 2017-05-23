import { Component } from "@angular/core";
import template from "./reset-password.html";
import style from "./reset-password.scss";
import {AlertController, NavParams, ToastController, ViewController} from "ionic-angular";
import * as _ from 'lodash';
import {TranslateHelperService} from "../../services/translate-helper";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {TranslateService} from "../../services/translate";
import {Location} from "@angular/common";

@Component({
    selector: "reset-password-page",
    template: template,
    styles: [ style ]
})
export class ResetPasswordPage {
    private passwordForm: FormGroup;

    constructor(private toastCtrl: ToastController, private params: NavParams,
                private translateHelper: TranslateHelperService, private alert: AlertController,
                private viewCtrl: ViewController, private fb: FormBuilder, private translate: TranslateService,
                private location: Location) {
        this.passwordForm = fb.group({
            password: ["", Validators.minLength(6)],
            passwordRepeat: ["", Validators.required],
        }, {validator: this.matchPassword('password', 'passwordRepeat')});
    }

    matchPassword(password1: string, password2: string) {
        return (group: FormGroup) => {
            let password1Input = group.controls[password1];
            let password2Input = group.controls[password2];
            if (password1Input.value !== password2Input.value) {
                return password2Input.setErrors({noMatch: true});
            }
        };
    }

    resetPassword() {
        if (!this.passwordForm.valid) {
            return;
        }
        Meteor.call('users.resetPasswordToken', {newPassword: this.passwordForm.controls['password'].value, token: this.params.get('token')}, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                this.alert.create({
                    title: this.translate.get('RESET_PASSWORD_PAGE.SUCCESS.TITLE'),
                    message: this.translate.get('RESET_PASSWORD_PAGE.SUCCESS.MESSAGE'),
                    buttons: [
                        {
                            text: this.translate.get('RESET_PASSWORD_PAGE.SUCCESS.OK'),
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
