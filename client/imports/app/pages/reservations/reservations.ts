import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import template from "./reservations.html";
import style from "./reservations.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {NavController} from "ionic-angular";
import {ReservationPage} from "../reservation/reservation";
import * as moment from 'moment';
import {QueryObserver} from "../../util/query-observer";

@Component({
    selector: "reservations-page",
    template,
    styles: [ style ]
})
export class ReservationsPage implements OnInit, OnDestroy {

    filter: string = "";
    private reservations: QueryObserver<Reservation>;

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private reservationsService: ReservationsDataService, private users: UserService,
                private navCtrl: NavController, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.reservations = new QueryObserver<Reservation>(this.reservationsService.getReservations(), this.ngZone, true);
    }

    ngOnDestroy() {
        if (this.reservations) {
            this.reservations.unsubscribe();
            this.reservations = null;
        }
    }

    newReservation() {
        this.navCtrl.push(ReservationPage);
    }
}
