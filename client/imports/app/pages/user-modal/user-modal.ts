import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import template from "./user-modal.html";
import style from "./user-modal.scss";
import * as _ from "lodash";
import {NavParams, ViewController} from "ionic-angular";
import {User} from "../../../../../both/models/user.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../services/user";

interface RoleDef {
    name: string;
    internalName: string;
}

class RoleAccess {
    constructor(private user: User, public roleDef: RoleDef) {
    }

    get isMember(): boolean {
        return _.includes(this.user.roles, this.roleDef.internalName);
    }

    set isMember(value: boolean) {
        if (value) {
            Meteor.users.update({_id: this.user._id}, {$addToSet: {roles: this.roleDef.internalName}});
        } else {
            Meteor.users.update({_id: this.user._id}, {$pull: {roles: this.roleDef.internalName}});
        }
    }
}

interface EditEmail extends Meteor.UserEmail {
    editAddress: string;
}

@Component({
    selector: "user-modal",
    template,
    styles: [ style ]
})
export class UserModal implements OnInit, OnDestroy {
    userId: string;
    user: User;

    hadInitialData: boolean = false;

    queryHandle: Meteor.LiveQueryHandle;
    emails: EditEmail[];

    get isAdmin(): boolean {
        return this.userService.isAdmin;
    }

    get isSelf(): boolean {
        return this.userId === this.userService.user._id;
    }

    get canEdit(): boolean {
        return this.isAdmin || this.isSelf;
    }

    userForm: FormGroup;
    usernameForm: FormGroup;
    userPasswordForm: FormGroup;

    newEmailAddress: string = "";

    roles: RoleAccess[] = [];
    rolesDef: RoleDef[] = [
        {
            name: "ADMIN",
            internalName: 'admin',
        },
        {
            name: "MANAGER",
            internalName: 'manager',
        },
    ];

    get titleParams() {
        return {name: (this.user?this.user.fullName:this.userId)};
    }

    constructor(private viewCtrl: ViewController, private params: NavParams,
                private fb: FormBuilder, private ngZone: NgZone, private userService: UserService) {
        this.userId = this.params.get('userId');
        this.userForm = fb.group({
            fullName: ["", Validators.required],
            phone: ["", Validators.required],
        });
        this.usernameForm = fb.group({
            username: [""],
        });
        this.userPasswordForm = fb.group({
            oldPassword: [""],
            newPassword: ["", Validators.required],
            newPasswordRepeat: ["", Validators.required],
        }, {validator: this.matchPassword('newPassword', 'newPasswordRepeat')});
    }

    updateUser(user: User) {
        this.user = user;
        console.log("Got user", this.user);
        this.emails = _.map(this.user.emails, (email) => {
            return {
                address: email.address,
                verified: email.verified,
                editAddress: email.address
            };
        });
        if (!this.hadInitialData) {
            this.usernameForm.controls['username'].setValue(this.user.username);
            this.userForm.controls['fullName'].setValue(this.user.fullName);
            this.userForm.controls['phone'].setValue(this.user.phone);
            this.roles = this.rolesDef.map((roleDef) => {
                return new RoleAccess(this.user, roleDef);
            });
            this.hadInitialData = true;
        }
    }

    ngOnInit() {
        this.queryHandle = Meteor.users.find(this.userId).observe({
            changed: (user) => {
                console.log("changed", user);
                this.ngZone.run(() => {
                    this.updateUser(user);
                });
            },
            added: (user) => {
                console.log("added", user);
                this.ngZone.run(() => {
                    this.updateUser(user);
                });
            }
        });
    }

    ngOnDestroy() {
        if (this.queryHandle) {
            this.queryHandle.stop();
            this.queryHandle = null;
        }
    }

    matchPassword(password1: string, password2: string) {
        return (group: FormGroup) => {
            let password1Input = group.controls[password1];
            let password2Input = group.controls[password2];
            if (password1Input.value !== password2Input.value) {
                return password2Input.setErrors({noMatch: true});
            }
        };
    }

    savePersonal() {
        Meteor.users.update({_id: this.user._id}, {$set: {
            fullName: this.userForm.controls['fullName'].value,
            phone: this.userForm.controls['phone'].value,
        }});
    }

    saveUsername() {
        Meteor.call('users.setUsername', {userId: this.user._id, username: this.userForm.controls['username'].value});
    }

    saveEmail(email: EditEmail) {
        if (email.editAddress !== email.address) {
            Meteor.call('users.updateEmail', {userId: this.userId, oldEmail: email.address, newEmail: email.editAddress});
        }
    }

    addEmail() {
        console.log("addEmail", this.newEmailAddress);
        Meteor.call('users.addEmail', {userId: this.userId, email: this.newEmailAddress});
        this.newEmailAddress = "";
    }

    deleteEmail(email: EditEmail) {
        console.log("deleteEmail", email);
        Meteor.call('users.removeEmail', {userId: this.userId, email: email.address});
    }

    savePassword() {
        console.log("savePassword");
        Meteor.call('users.updatePassword', {
            userId: this.userId,
            newPassword: this.userPasswordForm.controls['newPassword'].value,
            oldPassword: this.userPasswordForm.controls['oldPassword'].value
        });
    }

    close() {
        this.viewCtrl.dismiss();
    }
}
