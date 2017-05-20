import { Component, OnInit } from "@angular/core";
import template from "./tabs-nouser.html";
import style from "./tabs-nouser.scss";
import {LoginPage} from "../login/login";
import {SignupPage} from "../signup/signup";
import * as _ from 'lodash';
import {TranslateService} from "../../services/translate";

@Component({
    selector: "tabs-nouser-page",
    template: template,
    styles: [ style ]
})
export class TabsNouserPage {
    tabLogin = LoginPage;
    tabSignup = SignupPage;

    constructor(private translate: TranslateService) {
    }
}
