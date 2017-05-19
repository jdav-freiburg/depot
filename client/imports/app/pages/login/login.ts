import { Component, OnInit } from "@angular/core";
import template from "./login.html";
import style from "./login.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ToastController} from "ionic-angular";
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: "login-page",
    template: template,
    styles: [ style ]
})
export class LoginPage {
    public loginForm: FormGroup;

    constructor(private fb: FormBuilder, private toastCtrl: ToastController, private translate: TranslateService) {
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
                    let messageTextSubscription = this.translate.get(['ERROR.' + err.reason, "ERROR.GENERAL"], err).subscribe((messages: {[key: string]: string}) => {
                        console.log("Error Message:", messages);
                        let wasLoaded = (messages['ERROR.' + err.reason] !== 'ERROR.' + err.reason);
                        this.toastCtrl.create({
                            message: wasLoaded?messages['ERROR.' + err.reason]:messages['ERROR.GENERAL'],
                            duration: 2500,
                        }).present();
                        messageTextSubscription.unsubscribe();
                    });
                }
            }
        });
    }
}
