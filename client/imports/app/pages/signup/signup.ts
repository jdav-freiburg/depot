import { Component, OnInit } from "@angular/core";
import template from "./signup.html";
import style from "./signup.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: "signup-page",
    template: template,
    styles: [ style ]
})
export class SignupPage {
    public signupForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.signupForm = fb.group({
            username: ["", Validators.required],
            email: ["", Validators.email],
            password: ["", Validators.required],
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
        Accounts.createUser(<Meteor.User>{
            username: username,
            email: email,
            password: password,
            phone: phone,
            fullName: fullName
        });
    }
}
