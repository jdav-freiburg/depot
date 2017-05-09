import {Component, NgZone} from "@angular/core";
import template from "./app.component.html";
import style from "./app.component.scss";
import {TabsPage} from "./pages/tabs/tabs";
import {TabsNouserPage} from "./pages/tabs-nouser/tabs-nouser";

@Component({
    selector: "app",
    template,
    styles: [ style ]
})
export class AppComponent {
    rootPage: any;
    enableMenu: boolean;

    constructor(private zone: NgZone) {
        this.rootPage = Meteor.user()?TabsPage:TabsNouserPage;
        this.enableMenu = !!Meteor.user();
        Accounts.onLogin(() => {
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

    logout() {
        Meteor.logout();
    }
}
