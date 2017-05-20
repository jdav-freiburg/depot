import {Component, OnDestroy} from "@angular/core";
import template from "./home.html";
import style from "./home.scss";
import {NavController, ToastController} from "ionic-angular";
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

@Component({
    selector: "home-page",
    template: template,
    styles: [ style ]
})
export class HomePage implements OnDestroy {
    private reservationSubscription: Subscription;
    private reservations: Reservation[];

    private messagesSubscription: Subscription;
    private messages: GlobalMessage[] = [];

    private showNewMessage: boolean = false;
    private newMessageForm: FormGroup;
    private newMessagePreview: boolean = false;

    get lockedUsers(): User[] {
        return _.filter(this.users.users, (user) => user.status === 'locked');
    }

    get isAdmin(): boolean {
        return this.users.isAdmin;
    }

    constructor(private navCtrl: NavController, private users: UserService, private toast: ToastController,
        private translateHelper: TranslateHelperService, private globalMessages: GlobalMessagesDataService,
        private fb: FormBuilder, private reservationsService: ReservationsDataService) {
        this.messagesSubscription = globalMessages.getMessages().zone().subscribe((messages) => {
            this.messages = messages;
            console.log("Messages:", messages);
        });
        this.newMessageForm = fb.group({
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
        if (this.messagesSubscription) {
            this.messagesSubscription.unsubscribe();
            this.messagesSubscription = null;
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
}
