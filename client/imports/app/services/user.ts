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

    constructor(private ngZone: NgZone, private ref: ApplicationRef, private translate: TranslateService) {
        this.translate.languageKeyChange.subscribe((languageKey) => {
            _.forEach(this._users, (user) => this.updateFilter(user));
        });
        Accounts.onLogin(() => {
            ngZone.run(() => {
                this._user = <User>Meteor.user();
                if (this._user.status !== 'normal') {
                    Accounts.logout();
                }
                console.log("User:", this._user);
                this.userChange.next(this._user);
            });
        });
        Accounts.onLogout(() => {
            ngZone.run(() => {
                this._user = null;
                console.log("User:", this._user);
                this.userChange.next(this._user);
            });
        });
        Accounts.onPageLoadLogin(() => {
            ngZone.run(() => {
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
                this.ngZone.run(() => {
                    this.updateFilter(data);

                    this._users.push(data);
                    this.usersChange.next(this._users);
                });
            },
            changed: (data: User) => {
                this.ngZone.run(() => {
                    this.updateFilter(data);
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
                this.ngZone.run(() => {
                    _.remove(this._users, (user) => user._id === data._id);
                    console.log("user removed", this._users);
                    this.usersChange.next(this._users);
                });
            },
        });
    }

    private updateFilter(user: User): void {
        let statusText = (_.find(this.userStatusOptions, (option) => option.value === user.status) || {text: user.status}).text.toLowerCase();
        let rolesText = _.map(user.roles, (role) => (this.getUserRoleOption(role)||{text:role}).text.toLowerCase());
        user.filters = _.concat([user.fullName.toLowerCase(), user.phone, user.username, statusText], rolesText, _.map(user.emails, (email) => email.address));
    }

    public get users(): User[] {
        return this._users;
    }

    public login(user: string, password: string) {
        Meteor.loginWithPassword(user, password);
    }

    public setLanguage(language: string, callback?: Function) {
        if (this.user.language !== language) {
            Meteor.call('users.setLanguage', {language}, (err, res) => {
                this.ngZone.run(() => {
                    if (callback) {
                        callback(err, res);
                    }
                });
            });
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

    public tryGetUser(id: string): User {
        return _.find(this.users, user => user._id = id);
    }




    public savePersonal(userId: string, fullName: string, phone: string, callback?: Function) {
        Meteor.users.update({_id: userId}, {$set: {
            fullName: fullName,
            phone: phone,
        }}, {}, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public saveUsername(userId: string, username: string, callback?: Function) {
        Meteor.call('users.setUsername', {
            userId: userId,
            name: username
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public saveEmail(userId: string, oldAddress: string, newAddress: string, callback?: Function) {
        Meteor.call('users.updateEmail', {
            userId: userId,
            oldEmail: oldAddress,
            newEmail: newAddress
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public addEmail(userId: string, address: string, callback?: Function) {
        Meteor.call('users.addEmail', {
            userId: userId,
            email: address
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    deleteEmail(userId: string, address: string, callback?: Function) {
        Meteor.call('users.removeEmail', {
            userId: userId,
            email: address
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    savePassword(userId: string, newPassword: string, oldPassword?: string, callback?: Function) {
        Meteor.call('users.updatePassword', {
            userId: userId,
            newPassword: newPassword,
            oldPassword: oldPassword
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    saveUserStatus(userId: string, status: string, callback?: Function) {
        Meteor.call('users.setStatus', {
            userId: userId,
            status: status
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public unlockUser(user: User, callback?: Function) {
        Meteor.call('users.unlock', {
            userId: user._id
        }, (err, res) => {
            this.ngZone.run(() => {
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }
}