import * as _ from 'lodash';
import {ItemCollection} from "../../../both/collections/item.collection";
import {Item, ItemSchema} from "../../../both/models/item.model";
import {Roles} from "./utils";
import {ItemState, ItemStateSchema} from "../../../both/models/item-state.model";
import {ItemStateCollection} from "../../../both/collections/item-state.collection";
import SimpleSchema from "simpl-schema";
import * as moment from 'moment';

ItemCollection.allow({
    insert(userId: string, doc: Item): boolean {
        return false;
    },
    update(userId: string, doc: Item, fieldNames: string[], modifier: any): boolean {
        return false;
    },
    remove(userId: string, doc: Item): boolean {
        return false;
    }
});

Meteor.publish('items.public', function() {
    if (!this.userId) {
        return [];
    }
    return ItemCollection.find({status: 'public'});
});
Meteor.publish('items', function() {
    if (!this.userId) {
        return [];
    }
    if (Roles.userHasRole(this.userId, 'manager')) {
        return ItemCollection.find({});
    }
    return ItemCollection.find({status: 'public'});
});

Meteor.publish('item.states.all', function() {
    if (!this.userId) {
        return [];
    }
    if (Roles.userHasRole(this.userId, 'admin')) {
        return ItemStateCollection.find();
    }
    this.ready();
});

Meteor.publish('item.states', function(params: {itemId: string, start?: Date, end?: Date}) {
    if (!this.userId) {
        return [];
    }
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

const Future = Npm.require('fibers/future');

function insertItem(item: Item, updateComment: string) {
    item._id = Random.id();
    console.log("Insert item:", item);
    ItemCollection.insert(item);
    console.log("Inserted id:", item._id);
    ItemStateCollection.rawCollection().insert({
        timestamp: new Date(),
        itemId: item._id,
        fields: {
            _id: item._id,
            externalId: item.externalId,
            name: item.name,
            description: item.description,
            condition: item.condition,
            conditionComment: item.conditionComment,
            lastService: item.lastService,
            purchaseDate: item.purchaseDate,
            tags: item.tags,
            status: item.status},

        userId: this.userId,

        comment: updateComment
    });
    return item._id;
}

function updateItem(item: Item, itemRef: Item, updateComment: string) {
    let updateState = {
        timestamp: new Date(),
        itemId: itemRef._id,
        fields: {},

        userId: this.userId,

        comment: updateComment
    };

    let updateData: Item|any = {};

    let hadChange = false;

    if (item.externalId !== itemRef.externalId) {
        updateData.externalId = item.externalId;
        updateState.fields['externalId'] = item.externalId;
        hadChange = true;
    }
    if (item.name !== itemRef.name) {
        updateData.name = item.name;
        updateState.fields['name'] = item.name;
        hadChange = true;
    }
    if (item.description !== itemRef.description) {
        updateData.description = item.description;
        updateState.fields['description'] = item.description;
        hadChange = true;
    }
    if (item.condition !== itemRef.condition) {
        updateData.condition = item.condition;
        updateState.fields['condition'] = item.condition;
        hadChange = true;
    }
    if (item.conditionComment !== itemRef.conditionComment) {
        updateData.conditionComment = item.conditionComment;
        updateState.fields['conditionComment'] = item.conditionComment;
        hadChange = true;
    }
    if (!moment(item.purchaseDate).isSame(moment(itemRef.purchaseDate))) {
        updateData.purchaseDate = moment(item.purchaseDate).toDate();
        updateState.fields['purchaseDate'] = item.purchaseDate;
        hadChange = true;
    }
    if (!moment(item.lastService).isSame(moment(itemRef.lastService))) {
        updateData.lastService = moment(item.lastService).toDate();
        updateState.fields['lastService'] = item.lastService;
        hadChange = true;
    }
    if (item.picture !== itemRef.picture) {
        updateData.picture = item.picture;
        hadChange = true;
    }
    if (_.xor(item.tags, itemRef.tags).length !== 0) {
        updateData.tags = item.tags;
        updateState.fields['tags'] = item.tags;
        hadChange = true;
    }
    if (item.itemGroup !== itemRef.itemGroup) {
        updateData.itemGroup = item.itemGroup;
        updateState.fields['itemGroup'] = item.itemGroup;
        hadChange = true;
    }
    if (item.status !== itemRef.status) {
        updateData.status = item.status;
        updateState.fields['status'] = item.status;
        hadChange = true;
    }

    if (hadChange) {
        ItemStateSchema.validate(updateState);
        console.log("update item", item._id, updateData);
        ItemCollection.update({_id: item._id}, {$set: updateData});
        console.log("insert itemState", updateState);
        ItemStateCollection.insert(updateState);
    }
}

Meteor.methods({
    'items.insert'({item, updateComment}: {item: Item, updateComment: string}): string {
        if (!this.userId) {
            return;
        }
        if (!Roles.userHasRole(this.userId, 'manager')) {
            throw new Meteor.Error('unauthorized', 'User is not manager');
        }
        new SimpleSchema({
            item: ItemSchema,
            updateComment: String
        }).validate({item, updateComment});

        return insertItem(item, updateComment);
    },
    'items.addAll'({items, updateComment}: {items: Item[], updateComment?: string}): void {
        if (!this.userId) {
            return;
        }
        if (!Roles.userHasRole(this.userId, 'manager')) {
            throw new Meteor.Error('unauthorized', 'User it not manager');
        }
        new SimpleSchema({
            items: Array,
            "items.$": new SimpleSchema({
                _id: {type: String, optional: true}
            }).extend(ItemSchema),
            updateComment: {type: String, optional: true}
        }).validate({items, updateComment});

        _.forEach(items, (item) => {
            if (item._id) {
                let itemRef = ItemCollection.findOne({_id: item._id});
                if (itemRef) {
                    updateItem(item, itemRef, updateComment);
                } else {
                    insertItem(item, updateComment);
                }
            } else {
                insertItem(item, updateComment);
            }
        });
    },
    'items.update'({item, updateComment}: {item: Item, updateComment: string}): void {
        if (!this.userId) {
            return;
        }
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

        updateItem(item, itemRef, updateComment);
    },
    'items.remove'({itemId}: {itemId: string}): void {
        if (!this.userId) {
            return;
        }
        if (!Roles.userHasRole(this.userId, 'manager')) {
            throw new Meteor.Error('unauthorized', 'User it not manager');
        }
        new SimpleSchema({
            itemId: String
        }).validate({itemId});

        let itemRef = ItemCollection.findOne({_id: itemId});
        if (!itemRef) {
            throw new Meteor.Error('id', 'Invalid id');
        }
        ItemCollection.remove({_id: itemId});
        ItemStateCollection.remove({itemId: itemId});
    }
});