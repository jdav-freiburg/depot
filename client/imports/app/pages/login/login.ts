import { Component, OnInit } from "@angular/core";
import template from "./login.html";
import style from "./login.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AlertController, ToastController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import * as _ from 'lodash';

@Component({
    selector: "login-page",
    template: template,
    styles: [ style ]
})
export class LoginPage {
    public loginForm: FormGroup;

    constructor(private fb: FormBuilder, private toastCtrl: ToastController, private translate: TranslateService,
            private alert: AlertController) {
        this.loginForm = fb.group({
            email: ["", Validators.required],
            password: ["", Validators.required]
        });
    }

    doLogin() {
        let email = this.loginForm.controls['email'].value;
        let password = this.loginForm.controls['password'].value;
        console.log("Email: ", email);
        Meteor.loginWithPassword(email, password, (err) => {
            if (err) {
                console.log("Error:", err);
                if (err.error == 403) {
                    this.toastCtrl.create({
                        message: this.translate.has('ERROR.' + err.reason)?this.translate.get('ERROR.' + err.reason):this.translate.get('ERROR.GENERAL'),
                        duration: 2500,
                    }).present();
                }
            }
        });
    }
}
