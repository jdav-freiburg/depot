import { Component, OnInit } from "@angular/core";
import template from "./tabs-nouser.html";
import style from "./tabs-nouser.scss";
import {LoginPage} from "../login/login";
import {SignupPage} from "../signup/signup";
import {TranslateService} from "@ngx-translate/core";
import * as _ from 'lodash';

@Component({
    selector: "tabs-nouser-page",
    template: template,
    styles: [ style ]
})
export class TabsNouserPage {
    tabLogin = LoginPage;
    tabSignup = SignupPage;

    private _tabsNouserKeys = [
        {
            root: LoginPage,
            translate: "TABS.LOGIN",
            icon: "log-in"
        },
        {
            root: SignupPage,
            translate: "TABS.SIGNUP",
            icon: "person"
        }
    ];
    private tabsNouser = [];

    constructor(private translate: TranslateService) {
        this.translate.get(_.map(this._tabsNouserKeys, (key) => key.translate)).subscribe((texts) => {
            this.tabsNouser = _.map(this._tabsNouserKeys, (key) => {
                return {
                    text: texts[key.translate],
                    root: key.root,
                    icon: key.icon
                }
            });
        });
    }
}
