import { Component, OnInit } from "@angular/core";
import template from "./login.component.html";
import style from "./login.component.scss";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
    selector: "login",
    template: template,
    styles: [ style ]
})
export class LoginComponent implements OnInit {
    public loginForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.loginForm = fb.group({
            email: ["", Validators.required],
            password: ["", Validators.required]
        });
    }

    doLogin(event) {
        let email = this.loginForm.controls.email.value;
        let password = this.loginForm.controls.password.value;
        Meteor.loginWithPassword(email, password, (user) => { console.log(user); });
    }

    ngOnInit() {
    }
}
