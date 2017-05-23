/// <reference types="node" />

import './user.ts';
import './item.ts';
import './reservation.ts';
import './globalMessages.ts';
import {CreateUser, User} from "../../../both/models/user.model";
import {ItemStateCollection} from "../../../both/collections/item-state.collection";
import {ReservationCollection} from "../../../both/collections/reservation.collection";
import {TokenCollection} from "../../../both/collections/token.collection";
import {GlobalMessageCollection} from "../../../both/collections/global-message.collection";
import * as util from "util";
import {UserCollection} from "../../../both/collections/user.collection";

export class Main {
    start(): void {
        this.initFakeData();
    }

    initFakeData(): void {
        /*if (Accounts.findUserByUsername('admin')) {
            Meteor.users.remove({'username': 'admin'});
        }*/
        if (!process.env.ADMIN_NO_CREATE && !Accounts.findUserByUsername(process.env.ADMIN_USERNAME || 'admin') ) {
            let userData: CreateUser = {
                username: process.env.ADMIN_USERNAME || 'admin',
                fullName: 'Admin Admin',
                email: process.env.ADMIN_EMAIL || 'admin@localhost',
                password: process.env.ADMIN_PASSWORD ||'42',
                picture: null,
                phone: '00123456789',
                language: 'en',
                status: 'normal',
                roles: ['admin', 'manager']
            };
            let user = Accounts.createUser(userData);
            Meteor.users.update({_id: user}, {$set: {roles: ['admin', 'manager'], status: 'normal', emails: [{address: 'admin@localhost', verified: true}]}});
        }
    }
}

Meteor.startup(function () {
    Meteor.users._ensureIndex({username: 1});
    Meteor.users._ensureIndex({email: 1});
    ItemStateCollection.rawCollection().createIndex({itemId: 1});
    ReservationCollection.rawCollection().createIndex({start: -1, end: 1});
    ReservationCollection.rawCollection().createIndex({userId: 1, start: -1, end: 1});
    ReservationCollection.rawCollection().createIndex({itemIds: 1, start: -1, end: 1});
    TokenCollection.rawCollection().createIndex({token: 1});
    TokenCollection.rawCollection().createIndex({expiresAt: 1}, {expireAfterSeconds: 0});
    GlobalMessageCollection.rawCollection().createIndex({timestamp: 1})
});