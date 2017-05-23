import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import template from "./user-modal.html";
import style from "./user-modal.scss";
import * as _ from "lodash";
import {NavParams, ToastController, ViewController} from "ionic-angular";
import {User} from "../../../../../both/models/user.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {UserService} from "../../services/user";
import {TranslateHelperService} from "../../services/translate-helper";
import {TranslateOption} from "../../services/translate";
import {AdvancedEmailValidatorDirective} from "../../services/advanced-email-validator";

class RoleAccess {
    constructor(private user: User, public roleDef: TranslateOption) {
    }

    public isWorking: boolean;

    get isMember(): boolean {
        return _.includes(this.user.roles, this.roleDef.value);
    }

    set isMember(value: boolean) {
        this.isWorking = true;
        if (value) {
            Meteor.users.update({_id: this.user._id}, {$addToSet: {roles: this.roleDef.value}}, {}, (err) => {
                this.isWorking = false;
                if (err) {
                    console.log("Error:", err);
                }
            });
        } else {
            Meteor.users.update({_id: this.user._id}, {$pull: {roles: this.roleDef.value}}, {}, (err) => {
                this.isWorking = false;
                if (err) {
                    console.log("Error:", err);
                }
            });
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

    _userStatus: string = "";
    userStatusIsWorking: boolean = false;
    newEmailAddress: string = "";

    roles: RoleAccess[] = [];

    get titleParams() {
        return {name: (this.user?this.user.fullName:this.userId)};
    }

    constructor(private viewCtrl: ViewController, private params: NavParams,
                private fb: FormBuilder, private ngZone: NgZone, private userService: UserService,
                private toast: ToastController, private translateHelper: TranslateHelperService) {
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
            newPassword: ["", Validators.minLength(6)],
            newPasswordRepeat: ["", Validators.required],
            passwordRandom: ""
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
        this._userStatus = this.user.status;
        this.roles = this.userService.userRolesOptions.map((roleDef) => {
            return new RoleAccess(this.user, roleDef);
        });
        if (!this.hadInitialData) {
            this.usernameForm.controls['username'].setValue(this.user.username);
            this.usernameForm.markAsPristine();
            this.usernameForm.markAsUntouched();
            this.usernameForm.updateValueAndValidity();
            this.userForm.controls['phone'].setValue(this.user.phone);
            this.userForm.controls['fullName'].setValue(this.user.fullName);
            this.userForm.markAsPristine();
            this.userForm.markAsUntouched();
            this.userForm.updateValueAndValidity();
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
        this.userForm.disable();
        console.log("Saving personal:", this.userForm.controls['fullName'].value, this.userForm.controls['phone'].value);
        this.userService.savePersonal(this.user._id, this.userForm.controls['fullName'].value, this.userForm.controls['phone'].value,
            (err, res) => {
                this.userForm.enable();
                console.log("Saved personal");
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                } else {
                    this.userForm.markAsPristine();
                    this.userForm.markAsUntouched();
                    this.userForm.updateValueAndValidity();
                }
            });
    }

    saveUsername() {
        this.usernameForm.disable();
        console.log("saveUsername", this.usernameForm.controls['username'].value);
        this.userService.saveUsername(this.user._id, this.usernameForm.controls['username'].value,
            (err, result) => {
                this.usernameForm.enable();
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                }
            });
    }

    saveEmail(email: EditEmail) {
        if (!AdvancedEmailValidatorDirective.check(email.editAddress)) {
            return;
        }
        console.log("saveEmail", email.address, "==>", email.editAddress);
        if (email.editAddress !== email.address) {
            this.userService.saveEmail(this.user._id, email.address, email.editAddress,
                (err, result) => {
                    if (err) {
                        console.log("Error:", err);
                        this.toast.create({
                            message: this.translateHelper.getError(err),
                            duration: 2500
                        }).present();
                    }
                });
        }
    }

    addEmail() {
        if (!AdvancedEmailValidatorDirective.check(this.newEmailAddress)) {
            return;
        }
        console.log("addEmail", this.newEmailAddress);
        this.userService.addEmail(this.user._id, this.newEmailAddress,
            (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                } else {
                    this.newEmailAddress = "";
                }
            });
    }

    deleteEmail(email: EditEmail) {
        if (this.emails.length <= 1) {
            return;
        }
        console.log("deleteEmail", email);
        this.userService.deleteEmail(this.user._id, email.address,
            (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                }
            });
    }

    randomPassword() {
        let text = "";
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-!/=:?";

        for (let i = 0; i < 10; i++) {
            text += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        this.userPasswordForm.controls['passwordRandom'].setValue(text);
        this.userPasswordForm.controls['newPassword'].setValue(text);
        this.userPasswordForm.controls['newPasswordRepeat'].setValue(text);
        this.userPasswordForm.updateValueAndValidity();
    }

    savePassword() {
        console.log("savePassword");
        this.userPasswordForm.disable();
        this.userService.savePassword(this.user._id, this.userPasswordForm.controls['newPassword'].value,
            this.userPasswordForm.controls['oldPassword'].value,
            (err, result) => {
                this.userPasswordForm.enable();
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                } else {
                    this.userPasswordForm.controls['newPassword'].setValue("");
                    this.userPasswordForm.controls['newPasswordRepeat'].setValue("");
                    this.userPasswordForm.controls['oldPassword'].setValue("");
                    this.userPasswordForm.controls['passwordRandom'].setValue("");
                    this.userPasswordForm.markAsPristine();
                    this.userPasswordForm.markAsUntouched();
                    this.userPasswordForm.updateValueAndValidity();
                }
            });
    }

    get userStatus(): string {
        return this._userStatus;
    }

    set userStatus(status: string) {
        this._userStatus = status;
        console.log("saveStatus", status);
        this.userStatusIsWorking = true;
        this.userService.saveUserStatus(this.user._id, status,
            (err, result) => {
                this.userStatusIsWorking = false;
                if (err) {
                    console.log("Error:", err);
                    this.toast.create({
                        message: this.translateHelper.getError(err),
                        duration: 2500
                    }).present();
                }
            });
    }

    close() {
        this.viewCtrl.dismiss();
    }
}
