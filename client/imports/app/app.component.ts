import {Component, NgZone, ViewChild} from "@angular/core";
import template from "./app.component.html";
import style from "./app.component.scss";
import {TabsPage} from "./pages/tabs/tabs";
import {TabsNouserPage} from "./pages/tabs-nouser/tabs-nouser";
import {UserService} from "./services/user";
import {Nav} from "ionic-angular";
import {UsersPage} from "./pages/users/users";
import {DebugService} from "./services/debug";
import {UserModal} from "./pages/user-modal/user-modal";
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: "app",
    template,
    styles: [ style ]
})
export class AppComponent {
    get rootPage(): any {
        return this.userService.user?TabsPage:TabsNouserPage;
    }

    get enableMenu(): boolean {
        return !!this.userService.user;
    }

    @ViewChild(Nav) nav;

    get userName(): string {
        if (this.userService.user) {
            return this.userService.user.fullName;
        }
        return null;
    }

    get isAdmin(): boolean {
        return this.userService.isAdmin;
    }

    _language: string = "en";

    set language(value: string) {
        this._language = value;
        this.translate.use(value);
    }

    get language(): string {
        return this._language;
    }

    constructor(private userService: UserService, private debugService: DebugService,
        private translate: TranslateService) {
        translate.setDefaultLang('en');
        //this.translate.use(Platform.device.language);
    }

    editSelf() {
        this.nav.push(UserModal, {userId: this.userService.user._id});
    }

    showUsers() {
        this.nav.push(UsersPage);
    }

    logout() {
        Meteor.logout();
    }
}
