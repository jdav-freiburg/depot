import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";
import template from "./reservations.html";
import style from "./reservations.scss";
import * as _ from "lodash";
import {UserService} from "../../user.service";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {NavController} from "ionic-angular";
import {ReservationPage} from "../reservation/reservation";

@Component({
    selector: "reservations-page",
    template,
    styles: [ style ]
})
export class ReservationsPage implements OnInit {
    data: Observable<Reservation[]>;

    filter: string = "";

    constructor(private reservationsDataService: ReservationsDataService, private users: UserService,
                private navCtrl: NavController) {
    }

    ngOnInit() {
        this.data = this.reservationsDataService.getReservations().zone();
        this.data.subscribe((data) => {
            console.log("Reservations:", data);
        });
    }

    newItem() {
        this.navCtrl.push(ReservationPage);
    }

    editItem(id: string) {
        this.navCtrl.push(ReservationPage, {id: id});
    }
}
