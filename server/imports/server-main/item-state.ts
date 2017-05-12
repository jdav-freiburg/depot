import * as _ from 'lodash';
import {ItemCollection} from "../../../both/collections/item.collection";
import {Item} from "../../../both/models/item.model";
import {ItemStateCollection} from "../../../both/collections/item-state.collection";
import {ItemState} from "../../../both/models/item-state.model";

ItemStateCollection.allow({
    insert(userId: string, doc: ItemState): boolean {
        console.log("Insert", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    },
    update(userId: string, doc: ItemState, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc, fieldNames, modifier);
        return false;
    },
    remove(userId: string, doc: ItemState): boolean {
        console.log("Remove", doc);
        return false;
    }
});

Meteor.publish('itemStates', function() {
    console.log("register itemStates");
    return ItemStateCollection.find();
});