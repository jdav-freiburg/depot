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
import {TranslateHelperService} from "./services/translate-helper";
import {ItemsImporterPage} from "./pages/items-importer/items-importer";

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

    get isManager(): boolean {
        return this.userService.isManager;
    }

    constructor(private userService: UserService, private debugService: DebugService,
        private translateHelper: TranslateHelperService) {
    }

    editSelf() {
        this.nav.push(UserModal, {userId: this.userService.user._id});
    }

    showUsers() {
        this.nav.push(UsersPage);
    }

    importItems() {
        this.nav.push(ItemsImporterPage);
    }

    logout() {
        Meteor.logout();
    }
}
