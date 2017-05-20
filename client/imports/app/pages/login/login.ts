import { Component, OnInit } from "@angular/core";
import template from "./login.html";
import style from "./login.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AlertController, ToastController} from "ionic-angular";
import * as _ from 'lodash';
import {TranslateHelperService} from "../../services/translate-helper";
import {AdvancedEmailValidatorDirective} from "../../services/advanced-email-validator";

@Component({
    selector: "login-page",
    template: template,
    styles: [ style ]
})
export class LoginPage {
    public loginForm: FormGroup;

    constructor(private fb: FormBuilder, private toastCtrl: ToastController, private translateHelper: TranslateHelperService,
            private alert: AlertController) {
        this.loginForm = fb.group({
            emailOrUsername: ["", Validators.required],
            password: ["", Validators.required]
        });
    }

    doLogin() {
        let emailOrUsername = this.loginForm.controls['emailOrUsername'].value;
        let password = this.loginForm.controls['password'].value;
        console.log("Email/Username: ", emailOrUsername);
        Meteor.loginWithPassword(emailOrUsername, password, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toastCtrl.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            }
        });
    }
}
