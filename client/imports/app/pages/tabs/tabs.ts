import { Component, OnInit } from "@angular/core";
import template from "./tabs.html";
import style from "./tabs.scss";
import {HomePage} from "../home/home";
import {ItemsPage} from "../items/items";
import {LoginPage} from "../login/login";
import {SignupPage} from "../signup/signup";

@Component({
    selector: "tabs-page",
    template: template,
    styles: [ style ]
})
export class TabsPage {
    tabLogin = LoginPage;
    tabSignup = SignupPage;

    tabHome = HomePage;
    tabItems = ItemsPage;

    get loggedIn(): boolean {
        return !!Meteor.user();
    }

    constructor() {
    }
}
