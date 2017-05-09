import { Injectable, NgZone } from "@angular/core";
import {Group} from "../../../both/models/group.model";

@Injectable()
export class UserService {
    private _user: Meteor.User;
    private _groups: Group;

    constructor(private zone: NgZone) {
        Accounts.onLogin(() => {
            zone.run(() => {
                this._user = Meteor.user();
                console.log("User:", this._user);
            });
        });
        Accounts.onLogout(() => {
            zone.run(() => {
                this._user = null;
                console.log("User:", this._user);
            });
        });
        Accounts.onPageLoadLogin(() => {
            zone.run(() => {
                this._user = Meteor.user();
                console.log("User:", this._user);
            });
        });
        Tracker.autorun(() => {
            Meteor.subscribe('users');
        });
    }

    public login(user: string, password: string) {
        Meteor.loginWithPassword(user, password);
    }

    public get user(): Meteor.User {
        return this._user;
    }
}