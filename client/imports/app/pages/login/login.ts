import { Component, OnInit } from "@angular/core";
import template from "./login.html";
import style from "./login.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ToastController} from "ionic-angular";

@Component({
    selector: "login-page",
    template: template,
    styles: [ style ]
})
export class LoginPage {
    public loginForm: FormGroup;

    constructor(private fb: FormBuilder, private toastCtrl: ToastController) {
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
                let toast = this.toastCtrl.create({
                    message: err.message,
                    duration: 2500,
                });
                toast.present();
                console.log("Error:", err);
            }
        });
    }
}
