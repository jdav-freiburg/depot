import * as _ from 'lodash';
import {ReservationCollection} from "../../../both/collections/reservation.collection";
import {Reservation} from "../../../both/models/reservation.model";

ReservationCollection.allow({
    insert(userId: string, doc: Reservation): boolean {
        console.log("Insert", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    },
    update(userId: string, doc: Reservation, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc, fieldNames, modifier);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    },
    remove(userId: string, doc: Reservation): boolean {
        console.log("Remove", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    }
});

Meteor.publish('reservations', function() {
    return ReservationCollection.find();
});
