import * as _ from 'lodash';
import {ItemCollection} from "../../../both/collections/item.collection";
import {Item} from "../../../both/models/item.model";

ItemCollection.allow({
    insert(userId: string, doc: Item): boolean {
        console.log("Insert", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    },
    update(userId: string, doc: Item, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc, fieldNames, modifier);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    },
    remove(userId: string, doc: Item): boolean {
        console.log("Remove", doc);
        return Roles.userIsInRole(userId, ['admin', 'manager'], Roles.GLOBAL_GROUP);
    }
});

Meteor.publish('items.public', function() {
    return ItemCollection.find({status: 'public'});
});
Meteor.publish('items', function() {
    if (Roles.userIsInRole(this.userId, ['admin', 'manager'], Roles.GLOBAL_GROUP)) {
        return ItemCollection.find({});
    }
    return ItemCollection.find({status: 'public'});
});