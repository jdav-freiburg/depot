import { Component, OnInit } from "@angular/core";
import template from "./tabs-nouser.html";
import style from "./tabs-nouser.scss";
import {HomePage} from "../home/home";
import {ItemsPage} from "../items/items";
import {LoginPage} from "../login/login";
import {SignupPage} from "../signup/signup";

@Component({
    selector: "tabs-nouser-page",
    template: template,
    styles: [ style ]
})
export class TabsNouserPage {
    tabLogin = LoginPage;
    tabSignup = SignupPage;

    constructor() {
    }
}
