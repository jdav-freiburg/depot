import {ApplicationRef, Injectable, NgZone} from "@angular/core";
import {Group} from "../../../../both/models/group.model";
import {User} from "../../../../both/models/user.model";
import * as _ from "lodash";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";

@Injectable()
export class UserService {
    private _user: User;
    private _groups: Group[] = [];

    private _users: User[] = [];

    public readonly userChange: Subject<User> = new BehaviorSubject<User>(null);
    public readonly usersChange: Subject<User[]> = new BehaviorSubject<User[]>([]);

    constructor(private zone: NgZone, private ref: ApplicationRef) {
        Accounts.onLogin(() => {
            zone.run(() => {
                this._user = <User>Meteor.user();
                console.log("User:", this._user);
                this.userChange.next(this._user);
            });
        });
        Accounts.onLogout(() => {
            zone.run(() => {
                this._user = null;
                console.log("User:", this._user);
                this.userChange.next(this._user);
            });
        });
        Accounts.onPageLoadLogin(() => {
            zone.run(() => {
                this._user = <User>Meteor.user();
                console.log("User:", this._user);
                this.userChange.next(this._user);
            });
        });
        Tracker.autorun(() => {
            Meteor.subscribe('users');
        });
        Meteor.users.find({}, {sort: {_id: 1}}).observe({
            added: (data: User) => {
                this.zone.run(() => {
                    this._users.push(data);
                    console.log("user added", this._users);
                    this.usersChange.next(this._users);
                });
            },
            changed: (data: User) => {
                this.zone.run(() => {
                    if (this._user && this._user._id === data._id) {
                        this._user = data;
                        this.userChange.next(this._user);
                    }
                    let idx = _.findIndex(this._users, (user) => user._id === data._id);
                    if (idx === -1) {
                        this._users.push(data);
                    } else {
                        this._users[idx] = data;
                    }
                    console.log("user changed", this._users);
                    this.usersChange.next(this._users);
                });
            },
            removed: (data: User) => {
                this.zone.run(() => {
                    _.remove(this._users, (user) => user._id === data._id);
                    console.log("user removed", this._users);
                    this.usersChange.next(this._users);
                });
            },
        });
    }

    public get users(): User[] {
        return this._users;
    }

    public login(user: string, password: string) {
        Meteor.loginWithPassword(user, password);
    }

    public setLanguage(language: string) {
        if (this.user.language !== language) {
            Meteor.call('users.setLanguage', {language});
        }
    }

    public get user(): User {
        return this._user;
    }

    public get isAdmin(): boolean {
        return this._user && _.includes(this._user.roles, 'admin');
    }

    public get isManager(): boolean {
        return this._user && _.includes(this._user.roles, 'manager');
    }
}