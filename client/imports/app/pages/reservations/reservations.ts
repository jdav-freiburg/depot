import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import template from "./reservations.html";
import style from "./reservations.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {NavController} from "ionic-angular";
import {ReservationPage} from "../reservation/reservation";
import {ChangeableDataTransform, QueryObserverTransform} from "../../util/query-observer";
import {TranslateService} from "../../services/translate";

class ReservationExt implements Reservation {
    public _id: string;

    public type: string;
    public name: string;
    public start: Date;
    public end: Date;

    public userId: string;

    public groupId: string;

    public contact: string;

    public itemIds: string[];

    protected _filters: string[];

    public checkFilters(query: string[]): boolean {
        for (let i = 0; i < query.length; i++) {
            let any = false;
            for (let j = 0; j < this._filters.length; j++) {
                if (this._filters[j].indexOf(query[i]) !== -1) {
                    any = true;
                    break;
                }
            }
            if (!any) {
                return false;
            }
        }
        return true;
    }

    public updateText(translate: TranslateService, users: UserService) {
        this._filters = [this.name.toLowerCase(), translate.get('RESERVATION_PAGE.TYPE.' + this.type), this.contact.toLowerCase()];
        let user = users.tryGetUser(this.userId);
        if (user) {
            this._filters.push(user.fullName.toLowerCase())
        }
    }

    public updateFrom(item: Reservation, translate: TranslateService, users: UserService) {
        this._id = item._id;
        this.type = item.type;
        this.name = item.name;
        this.start = item.start;
        this.end = item.end;
        this.userId = item.userId;
        this.groupId = item.groupId;
        this.contact = item.contact;
        this.itemIds = _.clone(item.itemIds);
        this.updateText(translate, users);
    }

    public constructor(item: Reservation, translate: TranslateService, users: UserService) {
        this.updateFrom(item, translate, users);
    }
}

@Component({
    selector: "reservations-page",
    template,
    styles: [ style ]
})
export class ReservationsPage implements OnInit, OnDestroy {

    filter: string = "";
    private filterQuery: string[] = [];
    private reservations: QueryObserverTransform<Reservation, ReservationExt>;

    displayReservations: ReservationExt[] = [];

    constructor(private reservationsService: ReservationsDataService, private users: UserService,
                private navCtrl: NavController, private ngZone: NgZone, private translate: TranslateService) {
    }

    ngOnInit() {
        this.reservations = new QueryObserverTransform<Reservation, ReservationExt>({
            query: this.reservationsService.getReservations(),
            zone: this.ngZone,
            transformer: reservation => {
                let transformed: ReservationExt = (<ChangeableDataTransform<Reservation, ReservationExt>>reservation)._transformed;
                if (transformed) {
                    transformed.updateFrom(reservation, this.translate, this.users);
                } else {
                    transformed = new ReservationExt(reservation, this.translate, this.users);
                }
                return transformed;
            }
        });
        this.reservations.dataChanged.subscribe((reservations) => {
            this.displayReservations = _.filter(reservations, (reservation) => this.filter.length < 3 || reservation.checkFilters(this.filterQuery));
        });
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

    filterChange() {
        this.filterQuery = this.filter.toLowerCase().split(/\s+/);
        if (this.filter.length < 3) {
            this.displayReservations = this.reservations.data;
        } else {
            this.displayReservations = _.filter(this.reservations.data, (reservation) => reservation.checkFilters(this.filterQuery));
        }
    }
}
