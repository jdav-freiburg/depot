import {Component, NgZone, OnDestroy} from "@angular/core";
import template from "./home.html";
import style from "./home.scss";
import {AlertController, NavController, ToastController} from "ionic-angular";
import {User} from "../../../../../both/models/user.model";
import {UserService} from "../../services/user";

import * as _ from 'lodash';
import {TranslateHelperService} from "../../services/translate-helper";
import {GlobalMessagesDataService} from "../../services/global-messages-data";
import {Subscription} from "rxjs/Subscription";
import {GlobalMessage} from "../../../../../both/models/global-message.model";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {QueryObserver} from "../../util/query-observer";
import {TranslateService} from "../../services/translate";

@Component({
    selector: "home-page",
    template: template,
    styles: [ style ]
})
export class HomePage implements OnDestroy {
    private reservationSubscription: Subscription;
    private reservations: Reservation[];

    private messages: QueryObserver<GlobalMessage>;

    private showNewMessage: boolean = false;
    private newMessageForm: FormGroup;
    private newMessagePreview: boolean = false;

    private editMessageId: string = null;
    private editMessageForm: FormGroup;
    private editMessagePreview: boolean = false;

    get lockedUsers(): User[] {
        return _.filter(this.users.users, (user) => user.state === 'locked');
    }

    get isAdmin(): boolean {
        return this.users.isAdmin;
    }

    constructor(private navCtrl: NavController, private users: UserService, private toast: ToastController,
        private translateHelper: TranslateHelperService, private globalMessages: GlobalMessagesDataService,
        private fb: FormBuilder, private reservationsService: ReservationsDataService, private ngZone: NgZone,
        private alertCtrl: AlertController, private translate: TranslateService) {
        this.messages = new QueryObserver<GlobalMessage>(globalMessages.getMessages(), this.ngZone, true);
        this.newMessageForm = fb.group({
            message: ["", Validators.required],
        });

        this.editMessageForm = fb.group({
            message: ["", Validators.required],
        });

        this.reservationSubscription = this.reservationsService.getReservationsForUser(this.users.user._id, true).zone().subscribe((reservations) => {
            this.reservations = reservations;
            console.log("Own future reservations:", reservations);
        });
    }

    ngOnDestroy() {
        if (this.reservationSubscription) {
            this.reservationSubscription.unsubscribe();
            this.reservationSubscription = null;
        }
        if (this.messages) {
            this.messages.unsubscribe();
            this.messages = null;
        }
    }

    unlockUser(user: User) {
        console.log("Unlocking:", user);
        this.users.unlockUser(user, (err) => {
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            }
        });
    }

    newMessage() {
        this.showNewMessage = true;
        this.newMessagePreview = false;
    }

    cancelNewMessage() {
        this.newMessageForm.controls['message'].setValue('');
        this.newMessageForm.markAsPristine();
        this.newMessageForm.markAsUntouched();
        this.newMessageForm.updateValueAndValidity();
        this.showNewMessage = false;
        this.newMessagePreview = false;
    }

    createMessage() {
        if (!this.newMessageForm.valid) {
            return;
        }
        this.newMessageForm.disable();
        console.log("Creating message:", this.newMessageForm.controls['message'].value);
        this.globalMessages.createMessage(this.newMessageForm.controls['message'].value, (err) => {
            this.newMessageForm.enable();
            console.log("Message created");
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                this.newMessageForm.markAsPristine();
                this.newMessageForm.markAsUntouched();
                this.newMessageForm.updateValueAndValidity();
                this.showNewMessage = false;
                this.newMessagePreview = false;
            }
        });
    }

    editMessage(message) {
        this.editMessageId = message._id;
        this.editMessagePreview = false;
        this.editMessageForm.controls['message'].setValue(message.data.message);
        this.editMessageForm.markAsPristine();
        this.editMessageForm.markAsUntouched();
        this.editMessageForm.updateValueAndValidity();
    }

    cancelEditMessage() {
        this.editMessageForm.controls['message'].setValue('');
        this.editMessageForm.markAsPristine();
        this.editMessageForm.markAsUntouched();
        this.editMessageForm.updateValueAndValidity();
        this.editMessageId = null;
        this.editMessagePreview = false;
    }

    deleteMessage(message) {
        this.alertCtrl.create({
            title: this.translate.get('HOME_PAGE.DELETE.TITLE'),
            subTitle: this.translate.get('HOME_PAGE.DELETE.SUB_TITLE'),
            buttons: [
                {
                    text: this.translate.get('HOME_PAGE.DELETE.NO'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('HOME_PAGE.DELETE.YES'),
                    handler: () => {
                        this.editMessageForm.disable();
                        console.log("Delete message", message);
                        this.globalMessages.deleteMessage(message._id, (err) => {
                            this.editMessageForm.enable();
                            console.log("Message deleted");
                            if (err) {
                                console.log("Error:", err);
                                this.toast.create({
                                    message: this.translateHelper.getError(err),
                                    duration: 2500,
                                }).present();
                            } else if (this.editMessageId === message._id) {
                                this.editMessageForm.markAsPristine();
                                this.editMessageForm.markAsUntouched();
                                this.editMessageForm.updateValueAndValidity();
                                this.editMessageId = null;
                                this.editMessagePreview = false;
                            }
                        });
                    }
                }
            ]
        }).present();
    }

    saveMessage(message) {
        if (!this.editMessageForm.valid) {
            return;
        }
        this.editMessageForm.disable();
        console.log("Saving message:", this.editMessageForm.controls['message'].value);
        this.globalMessages.saveMessage(message._id, this.editMessageForm.controls['message'].value, (err) => {
            this.editMessageForm.enable();
            console.log("Message saved");
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500,
                }).present();
            } else {
                this.editMessageForm.markAsPristine();
                this.editMessageForm.markAsUntouched();
                this.editMessageForm.updateValueAndValidity();
                this.editMessageId = null;
                this.editMessagePreview = false;
            }
        });
    }
}
