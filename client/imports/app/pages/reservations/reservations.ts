import {Component, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import template from "./reservations.html";
import style from "./reservations.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {AlertController, NavController} from "ionic-angular";
import {ReservationPage} from "../reservation/reservation";
import {Subscription} from "rxjs/Subscription";
import * as moment from 'moment';
import {TranslateService} from "@ngx-translate/core";

@Component({
    selector: "reservations-page",
    template,
    styles: [ style ]
})
export class ReservationsPage implements OnInit, OnDestroy {
    reservations: Reservation[];

    filter: string = "";
    private reservationSubscription: Subscription;

    get isAdmin(): boolean {
        return this.users.isAdmin;
    }

    isOwner(userId): boolean {
        return this.users.user && this.users.user._id === userId;
    }

    get isManager(): boolean {
        return this.users.isManager;
    }

    constructor(private reservationsDataService: ReservationsDataService, private users: UserService,
                private navCtrl: NavController, private alertCtrl: AlertController, private translate: TranslateService) {
    }

    ngOnInit() {
        this.reservationSubscription = this.reservationsDataService.getReservations().zone().subscribe((reservations) => {
            this.reservations = reservations;
        });
    }

    ngOnDestroy() {
        if (this.reservationSubscription) {
            this.reservationSubscription.unsubscribe();
            this.reservationSubscription = null;
        }
    }

    newReservation() {
        this.navCtrl.push(ReservationPage);
    }

    editReservation(id: string) {
        this.navCtrl.push(ReservationPage, {reservationId: id});
    }

    canDelete(reservation: Reservation) {
        return this.isAdmin || (this.isOwner(reservation.userId) && moment(reservation.start).isAfter(moment()))
    }

    deleteReservation(reservation: Reservation) {
        if (!this.canDelete(reservation)) {
            return;
        }
        let messageTextTranslation = this.translate.get(['RESERVATIONS_PAGE.DELETE.TITLE', 'RESERVATIONS_PAGE.DELETE.MESSAGE',
            'RESERVATIONS_PAGE.DELETE.YES', 'RESERVATIONS_PAGE.DELETE.NO'], {name: reservation.name}).subscribe((messages) => {
            this.alertCtrl.create({
                title: messages['RESERVATIONS_PAGE.DELETE.TITLE'],
                message: messages['RESERVATIONS_PAGE.DELETE.MESSAGE'],
                buttons: [
                    {
                        text: messages['RESERVATIONS_PAGE.DELETE.NO'],
                        role: 'cancel'
                    },
                    {
                        text: messages['RESERVATIONS_PAGE.DELETE.YES'],
                        handler: () => {
                            this.reservationsDataService.remove(reservation._id);
                        }
                    }
                ]
            }).present();
            messageTextTranslation.unsubscribe();
        });
    }
}
