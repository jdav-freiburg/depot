import * as _ from 'lodash';
import {ItemCollection} from "../../../both/collections/item.collection";
import {Item, ItemSchema} from "../../../both/models/item.model";
import {Roles} from "./utils";
import {ItemState} from "../../../both/models/item-state.model";
import {ItemStateCollection} from "../../../both/collections/item-state.collection";
import {Observable} from "rxjs/Observable";
import SimpleSchema from "simpl-schema";


class UpdateState {
    public updateState: ItemState;
    private valueRef: Item;
    public updateData: {[key: string]: any} = {};

    constructor(itemRef: Item, userId: string, updateComment: string) {
        this.valueRef = itemRef;
        this.updateState = {
            timestamp: new Date(),
            itemId: itemRef._id,
            fieldNames: [],
            fieldValues: [],

            userId: userId,

            comment: updateComment
        };
    }

    public setValue(name: string, value: any, valueStr: string = null) {
        if (value !== undefined && this.valueRef[name] !== value) {
            this.updateData[name] = value;
            this.updateState.fieldNames.push(name);
            this.updateState.fieldValues.push(valueStr === null ? value : valueStr);
        }
    }
}

ItemCollection.allow({
    insert(userId: string, doc: Item): boolean {
        console.log("Insert", doc);
        return Roles.userHasRole(userId, 'manager');
    },
    update(userId: string, doc: Item, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc);
        return Roles.userHasRole(userId, 'manager');
    },
    remove(userId: string, doc: Item): boolean {
        console.log("Remove", doc);
        return Roles.userHasRole(userId, 'manager');
    }
});

Meteor.publish('items.public', function() {
    return ItemCollection.find({status: 'public'});
});
Meteor.publish('items', function() {
    if (Roles.userHasRole(this.userId, 'manager')) {
        return ItemCollection.find({});
    }
    return ItemCollection.find({status: 'public'});
});

Meteor.publish('item.states', function(params: {itemId: string, start?: Date, end?: Date}) {
    console.log("register itemStates");
    if (!params) {
        throw new Meteor.Error('validation', 'Missing parameters');
    }
    new SimpleSchema({
        itemId: { type: String },
        start: { type: Date, optional: true },
        end: { type: Date, optional: true },
    }).validate(params);
    let query = {itemId: params.itemId};
    if (params.start && params.end) {
        query['timestamp'] = {$gte: params.start, $lte: params.end};
    } else if (params.start) {
        query['timestamp'] = {$gte: params.start};
    } else if (params.end) {
        query['timestamp'] = {$lte: params.end};
    }
    return ItemStateCollection.find(query, {sort: {timestamp: -1}});
});

Meteor.methods({
    'items.insert'({item, updateComment}: {item: Item, updateComment: string}): string {
        if (!Roles.userHasRole(this.userId, 'manager')) {
            throw new Meteor.Error('unauthorized', 'User is not manager');
        }
        new SimpleSchema({
            item: ItemSchema,
            updateComment: String
        }).validate({item, updateComment});

        let id = <string><any>ItemCollection.insert(item);
        ItemStateCollection.insert({
            timestamp: new Date(),
            itemId: id,
            fieldNames: ['_id', 'externalId', 'name', 'description', 'condition', 'conditionComment', 'lastService', 'tags', 'status'],
            fieldValues: [item._id, item.externalId, item.name, item.description, item.condition.toString(), item.conditionComment, item.lastService.toISOString(), item.tags.join(","), item.status],

            userId: this.userId,

            comment: updateComment
        });
        return id;
    },
    'items.update'({item, updateComment}: {item: Item, updateComment: string}): void {
        if (!Roles.userHasRole(this.userId, 'manager')) {
            throw new Meteor.Error('unauthorized', 'User it not manager');
        }
        new SimpleSchema({
            item: new SimpleSchema({
                _id: {type: String}
            }).extend(ItemSchema),
            updateComment: String
        }).validate({item, updateComment});

        let itemRef = ItemCollection.findOne({_id: item._id});
        if (!itemRef) {
            throw new Meteor.Error('id', 'Invalid id');
        }

        let updateState = new UpdateState(itemRef, this.userId, updateComment);
        updateState.setValue('externalId', item.externalId);
        updateState.setValue('name', item.name);
        updateState.setValue('description', item.description);
        updateState.setValue('condition', item.condition);
        updateState.setValue('conditionComment', item.conditionComment);
        updateState.setValue('lastService', item.lastService, item.lastService.toISOString());
        if (itemRef.picture !== item.picture) {
            updateState.updateData['picture'] = item.picture;
        }
        updateState.setValue('tags', item.tags, item.tags.join(","));
        updateState.setValue('status', item.status);

        if (updateState.updateState.fieldNames.length !== 0) {
            console.log("update item", item._id, updateState.updateData);
            ItemCollection.update({_id: item._id}, {$set: updateState.updateData});
            console.log("insert itemState", updateState.updateState);
            ItemStateCollection.insert(updateState.updateState);
        }
    }
});