import {ApplicationRef, Injectable, NgZone} from "@angular/core";
import {Group} from "../../../../both/models/group.model";
import {User} from "../../../../both/models/user.model";
import * as _ from "lodash";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {TranslateOption, TranslateService} from "./translate";
import {colors} from "../colors";

@Injectable()
export class UserService {
    private _user: User;
    private _groups: Group[] = [];

    private _users: User[] = [];

    public readonly userChange: Subject<User> = new BehaviorSubject<User>(null);
    public readonly usersChange: Subject<User[]> = new BehaviorSubject<User[]>([]);

    public get userRolesOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'USER.ROLES.ADMIN',
                value: "admin",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'USER.ROLES.MANAGER',
                value: "manager",
                color: 'warning',
                colorCss: colors.warning,
                text: ""
            }
        ]);
    };

    public getUserRoleOption(roleName: string): TranslateOption {
        return this.userRolesOptions.find((role) => role.value === roleName);
    }

    public get userStatusOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'USER.STATUS.NORMAL',
                value: "normal",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'USER.STATUS.LOCKED',
                value: "locked",
                color: 'warning',
                colorCss: colors.warning,
                text: ""
            },
            {
                translate: 'USER.STATUS.DISABLED',
                value: "disabled",
                color: 'danger',
                colorCss: colors.danger,
                text: ""
            },
            /*{
                translate: 'USER.STATUS.DELETED',
                value: "deleted",
                color: 'danger',
                colorCss: colors.danger,
                text: ""
            }*/
        ]);
    };

    constructor(private zone: NgZone, private ref: ApplicationRef, private translate: TranslateService) {
        Accounts.onLogin(() => {
            zone.run(() => {
                this._user = <User>Meteor.user();
                if (this._user.status !== 'normal') {
                    Accounts.logout();
                }
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
                if (this._user.status !== 'normal') {
                    Accounts.logout();
                }
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
                        if (this._user.status !== 'normal') {
                            Accounts.logout();
                        }
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