import * as _ from 'lodash';
import {ReservationCollection} from "../../../both/collections/reservation.collection";
import {Reservation} from "../../../both/models/reservation.model";

ReservationCollection.allow({
    insert(userId: string, doc: Reservation): boolean {
        console.log("Insert", doc);
        return true;
    },
    update(userId: string, doc: Reservation, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP) || doc.userId === userId;
    },
    remove(userId: string, doc: Reservation): boolean {
        console.log("Remove", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP) || doc.userId === userId;
    }
});

Meteor.publish('reservations', function() {
    console.log("Register reservations");
    return ReservationCollection.find();
});
