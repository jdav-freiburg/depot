import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";

import * as _ from 'lodash';
import {ReservationCollection} from "../../../../both/collections/reservation.collection";
import {Reservation} from "../../../../both/models/reservation.model";

@Injectable()
export class ReservationsDataService {
    private reservations: ObservableCursor<Reservation>;

    constructor(private ngZone: NgZone) {
        Tracker.autorun(() => {
            Meteor.subscribe('reservations');
        });
        this.reservations = ReservationCollection.find({});
    }

    public getReservations(): ObservableCursor<Reservation> {
        return this.reservations;
    }

    public add(item: Reservation): void {
        ReservationCollection.insert(item);
    }

    public update(item: Reservation): void {
        let itemData = _.pick(item, ['type', 'name', 'start', 'end', 'userId', 'group',
            'contact', 'items']);
        ReservationCollection.update({_id: item._id}, {$set: itemData}, (error) => {
            console.log(error);
        });
    }
}
