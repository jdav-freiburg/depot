import { Component } from "@angular/core";
import template from "./app.component.html";
import style from "./app.component.scss";
import {Meteor} from "meteor/meteor";
import {UserService} from "./user.service";
import {ItemsComponent} from "./items/items.component";
import {LoginComponent} from "./login/login.component";

@Component({
    selector: "app",
    template,
    styles: [ style ]
})
export class AppComponent {
    rootPage: any;

    constructor(private userService: UserService) {
        this.rootPage = Meteor.user() ? ItemsComponent : LoginComponent;
    }

    logout() {
        Accounts.logout();
    }

    get user(): Meteor.User {
        return this.userService.user;
    }
}
