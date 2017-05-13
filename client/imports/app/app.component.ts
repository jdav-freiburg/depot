import {Component, NgZone, ViewChild} from "@angular/core";
import template from "./app.component.html";
import style from "./app.component.scss";
import {TabsPage} from "./pages/tabs/tabs";
import {TabsNouserPage} from "./pages/tabs-nouser/tabs-nouser";
import {UserService} from "./services/user";
import {Nav, NavController} from "ionic-angular";
import {UsersPage} from "./pages/users/users";

@Component({
    selector: "app",
    template,
    styles: [ style ]
})
export class AppComponent {
    rootPage: any;
    enableMenu: boolean;

    @ViewChild(Nav) nav;

    get isAdmin(): boolean {
        return this.userService.isAdmin;
    }

    constructor(private zone: NgZone, private userService: UserService) {
        this.rootPage = Meteor.user()?TabsPage:TabsNouserPage;
        this.enableMenu = !!Meteor.user();
        Accounts.onLogin((user) => {
            zone.run(() => {
                this.rootPage = TabsPage;
                this.enableMenu = true;
            });
        });
        Accounts.onPageLoadLogin((user) => {
            zone.run(() => {
                this.rootPage = TabsPage;
                this.enableMenu = true;
            });
        });
        Accounts.onLogout(() => {
            zone.run(() => {
                this.rootPage = TabsNouserPage;
                this.enableMenu = false;
            });
        });
    }

    showUsers() {
        this.nav.push(UsersPage);
    }

    logout() {
        Meteor.logout();
    }
}
