import { Component } from "@angular/core";
import template from "./app.component.html";
import style from "./app.component.scss";
import {Meteor} from "meteor/meteor";
import {UserService} from "./user.service";

@Component({
    selector: "app",
    template,
    styles: [ style ]
})
export class AppComponent {
    private Meteor = Meteor;

    constructor(private userService: UserService) {
    }

    logout() {
        Accounts.logout();
    }

    get user(): Meteor.User {
        return this.userService.user;
    }
}
