import {Injectable} from "@angular/core";
import {Group} from "../../../../both/models/group.model";
import * as _ from "lodash";
import {ItemCollection} from "../../../../both/collections/item.collection";
import {ItemStateCollection} from "../../../../both/collections/item-state.collection";
import {ReservationCollection} from "../../../../both/collections/reservation.collection";
import {GroupCollection} from "../../../../both/collections/group.collection";
import {MongoObservable} from "meteor-rxjs";
import {Item} from "../../../../both/models/item.model";
import {ItemState} from "../../../../both/models/item-state.model";
import {Reservation} from "../../../../both/models/reservation.model";


@Injectable()
export class DebugService {
    constructor() {
        (<any>Meteor).debug = {
            ItemCollection,
            ItemStateCollection,
            ReservationCollection,
            GroupCollection,
            dump<T>(collection: MongoObservable.Collection<T>): T[] {
                return collection.find({}).fetch();
            },
            dumpItems(): Item[] {
                return this.dump(this.ItemCollection);
            },
            dumpItemStates(): ItemState[] {
                return this.dump(this.ItemStateCollection);
            },
            dumpReservations(): Reservation[] {
                return this.dump(this.ReservationCollection);
            },
            dumpGroups(): Group[] {
                return this.dump(this.GroupCollection);
            }
        };
    }
}