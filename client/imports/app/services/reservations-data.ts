import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";

import * as _ from 'lodash';
import {ReservationCollection} from "../../../../both/collections/reservation.collection";
import {Reservation} from "../../../../both/models/reservation.model";
import {Observable} from "rxjs/Observable";
import {TranslateOption, TranslateService} from "./translate";
import {colors} from "../colors";

@Injectable()
export class ReservationsDataService {
    constructor(private ngZone: NgZone, private translate: TranslateService) {
        Tracker.autorun(() => {
            Meteor.subscribe('reservations');
        });
    }

    public get reservationTypeOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'RESERVATION.TYPE.GROUP',
                value: "group",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'RESERVATION.TYPE.PRIVATE',
                value: "private",
                color: 'warning',
                colorCss: colors.warning,
                text: ""
            }
        ]);
    }

    public getReservations(maxCount?: number): ObservableCursor<Reservation> {
        if (maxCount !== undefined) {
            return ReservationCollection.find({}, {sort: {start: -1}, limit: maxCount});
        }
        return ReservationCollection.find({}, {sort: {start: -1}});
    }

    public getReservationsForUser(userId: string, onlyFuture?: boolean): ObservableCursor<Reservation> {
        if (onlyFuture) {
            return ReservationCollection.find({userId: userId, end: {$gte: new Date()}}, {sort: {start: -1}});
        }
        return ReservationCollection.find({userId: userId}, {sort: {start: -1}});
    }

    public getReservationsForGroup(groupId: string, onlyFuture?: boolean): ObservableCursor<Reservation> {
        if (onlyFuture) {
            return ReservationCollection.find({groupId: groupId, end: {$gte: new Date()}}, {sort: {start: -1}});
        }
        return ReservationCollection.find({groupId: groupId}, {sort: {start: -1}});
    }

    public add(item: Reservation, callback?: Function): void {
        ReservationCollection.insert(item).subscribe((objectId) => {
            this.ngZone.run(() => {
                item._id = objectId;
                if (callback) {
                    callback();
                }
            });
        }, (error) => {
            this.ngZone.run(() => {
                callback(error);
            });
        });
    }

    public update(item: Reservation, callback?: Function): void {
        let itemData = _.pick(item, ['type', 'name', 'start', 'end', 'userId', 'groupId',
            'contact', 'itemIds']);
        console.log("reservation updating", item._id, itemData);
        let result = ReservationCollection.update({_id: item._id}, {$set: itemData});
        result.subscribe((result) => {
            this.ngZone.run(() => {
                console.log("reservation update:", result);
                if (callback) {
                    if (result === 1) {
                        callback();
                    } else {
                        callback('Not stored');
                    }
                }
            });
        }, (error) => {
            this.ngZone.run(() => {
                console.log("reservation update error:", error);
                if (callback) {
                    callback(error);
                }
            });
        });
    }

    public getReservation(id: string): ObservableCursor<Reservation> {
        return ReservationCollection.find({_id: id});
    }

    public getReservationsIn(start?: Date, end?: Date): ObservableCursor<Reservation> {
        let selector = {};
        if (start && end) {
            selector = {start: {$lte: end}, end: {$gte: start}};
        } else if (start) {
            selector = {end: {$gte: start}};
        } else if (end) {
            selector = {start: {$lte: end}};
        }
        return ReservationCollection.find(selector);
    }

    public remove(id: string, callback?: Function): Observable<number> {
        console.log("reservation removing", id);
        let result = ReservationCollection.remove({_id: id});
        result.subscribe((result) => {
            this.ngZone.run(() => {
                console.log("reservation remove:", result);
                if (callback) {
                    callback();
                }
            });
        }, (error) => {
            this.ngZone.run(() => {
                console.log("reservation remove error:", error);
                if (callback) {
                    callback(error);
                }
            });
        });
        return result;
    }

    getReservationsForItem(itemId: string): ObservableCursor<Reservation> {
        return ReservationCollection.find({itemIds: itemId});
    }

    getReservationsForItems(itemIds: string[]): ObservableCursor<Reservation> {
        return ReservationCollection.find({itemIds: {$in: itemIds}});
    }
}
