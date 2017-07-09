import * as _ from 'lodash';
import {Roles} from "./utils";
import SimpleSchema from "simpl-schema";
import {GlobalMessageCollection} from "../../../both/collections/global-message.collection";
import {GlobalMessage} from "../../../both/models/global-message.model";

GlobalMessageCollection.allow({
    insert(userId: string, doc: GlobalMessage): boolean {
        return false;
    },
    update(userId: string, doc: GlobalMessage, fieldNames: string[], modifier: any): boolean {
        console.log("Update", doc);
        return false;
    },
    remove(userId: string, doc: GlobalMessage): boolean {
        console.log("Remove", doc);
        return false;
    }
});

Meteor.publish('globalMessages', function(params?: {start?: Date, end?: Date}) {
    if (!this.userId) {
        return [];
    }
    if (params) {
        new SimpleSchema({
            start: { type: Date, optional: true },
            end: { type: Date, optional: true },
        }).validate(params);
    }
    console.log("Register globalMessages", params);
    let selector = {};
    if (params) {
        if (params.start && params.end) {
            selector['timestamp'] = {$gte: params.start, $lte: params.end};
        } else if (params.start) {
            selector['timestamp'] = {$gte: params.start};
        } else if (params.end) {
            selector['timestamp'] = {$lte: params.end};
        }
    }
    return GlobalMessageCollection.find(selector);
});

Meteor.methods({
    'globalMessages.create'({message}: {message: string}): void {
        if (!Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', 'User is not admin');
        }
        new SimpleSchema({
            message: String
        }).validate({message});
        GlobalMessageCollection.insert({
            type: 'message',
            timestamp: new Date(),
            data: {message}
        });
    },
    'globalMessages.save'({id, message}: {id: string, message: string}): void {
        if (!Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', 'User is not admin');
        }
        new SimpleSchema({
            id: String,
            message: String
        }).validate({id, message});
        if (!GlobalMessageCollection.findOne({_id: id, type: 'message'})) {
            throw new Meteor.Error('invalid-id', 'Invalid id');
        }
        GlobalMessageCollection.update({
            _id: id,
        }, {$set: {data: {message}}});
    },
    'globalMessages.delete'({id}: {id: string}): void {
        if (!Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', 'User is not admin');
        }
        new SimpleSchema({
            id: String
        }).validate({id});
        GlobalMessageCollection.remove({
            _id: id
        });
    },
});