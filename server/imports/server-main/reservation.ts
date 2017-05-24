import * as _ from 'lodash';
import {ReservationCollection} from "../../../both/collections/reservation.collection";
import {Reservation} from "../../../both/models/reservation.model";
import {Roles} from "./utils";
import SimpleSchema from "simpl-schema";

ReservationCollection.allow({
    insert(userId: string, doc: Reservation): boolean {
        if (!userId) {
            return false;
        }
        console.log("Insert", doc);
        return true;
    },
    update(userId: string, doc: Reservation, fieldNames: string[], modifier: any): boolean {
        if (!userId) {
            return false;
        }
        console.log("Update", doc);
        return Roles.userHasRole(userId, 'admin') || doc.userId === userId;
    },
    remove(userId: string, doc: Reservation): boolean {
        if (!userId) {
            return false;
        }
        console.log("Remove", doc);
        return Roles.userHasRole(userId, 'admin') || doc.userId === userId;
    }
});

Meteor.publish('reservations', function(params?: {start?: Date, end?: Date}) {
    if (!this.userId) {
        return [];
    }
    if (params) {
        new SimpleSchema({
            start: { type: Date, optional: true },
            end: { type: Date, optional: true },
        }).validate(params);
    }
    console.log("Register reservations");
    let selector = {};
    if (params) {
        if (params.start && params.end) {
            selector['end'] = {$gte: params.start};
            selector['start'] = {$lte: params.end};
        } else if (params.start) {
            selector['end'] = {$gte: params.start};
        } else if (params.end) {
            selector['start'] = {$lte: params.end};
        }
    }
    return ReservationCollection.find(selector);
});
