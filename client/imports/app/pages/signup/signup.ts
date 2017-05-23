import { Component } from "@angular/core";
import template from "./signup.html";
import style from "./signup.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {AlertController, ToastController} from "ionic-angular";
import {TranslateHelperService} from "../../services/translate-helper";
import {TranslateService} from "../../services/translate";
import {AdvancedEmailValidatorDirective} from "../../services/advanced-email-validator";

@Component({
    selector: "signup-page",
    template: template,
    styles: [ style ]
})
export class SignupPage {
    public signupForm: FormGroup;

    constructor(private fb: FormBuilder, private translateHelper: TranslateHelperService,
                private translate: TranslateService, private toast: ToastController, private alert: AlertController) {
        this.signupForm = fb.group({
            username: ["", Validators.required],
            email: ["", AdvancedEmailValidatorDirective.validator],
            password: ["", Validators.minLength(6)],
            password2: ["", Validators.required],
            phone: ["", Validators.required],
            fullName: ["", Validators.required],
        }, {validator: this.matchPassword('password', 'password2')});
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

    doSignup(event) {
        let username = this.signupForm.controls['username'].value;
        let email = this.signupForm.controls['email'].value;
        let password = this.signupForm.controls['password'].value;
        let phone = this.signupForm.controls['phone'].value;
        let fullName = this.signupForm.controls['fullName'].value;
        Meteor.call('users.createAccount', {
            username: username,
            email: email,
            password: password,
            phone: phone,
            language: this.translate.languageKey,
            fullName: fullName
        }, (err, user) => {
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                console.log("Created:", user);
                this.signupForm.reset();
                this.alert.create({
                    title: this.translate.get('SIGNUP_PAGE.SUCCESS.TITLE'),
                    message: this.translate.get('SIGNUP_PAGE.SUCCESS.MESSAGE')
                }).present();
            }
        });
        // TODO: Error messages
    }
}
