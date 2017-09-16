/// <reference types="node" />

import './user.ts';
import './item.ts';
import './reservation.ts';
import './global-messages.ts';
import './picture-store.ts';
import {CreateUser, User} from "../../../both/models/user.model";
import {ItemStateCollection} from "../../../both/collections/item-state.collection";
import {ReservationCollection} from "../../../both/collections/reservation.collection";
import {TokenCollection} from "../../../both/collections/token.collection";
import {GlobalMessageCollection} from "../../../both/collections/global-message.collection";
import * as util from "util";
import * as _ from "lodash";
import {ItemCollection} from "../../../both/collections/item.collection";
import {MongoObservable} from "meteor-rxjs";
import {FileCollection} from "../../../both/collections/file.collection";
import {UploadFS} from "meteor/jalik:ufs";
import {Picture} from "../../../both/models/picture.model";
import {Item} from "../../../both/models/item.model";
import {UserCollection} from "../../../both/collections/user.collection";

export class Main {
    start(): void {
        this.initFakeData();
    }

    initFakeData(): void {
        if (process.env.ADMIN_FORCE_CREATE && Accounts.findUserByUsername('admin')) {
            Meteor.users.remove({'username': 'admin'});
        }
        if (process.env.ADMIN_FORCE_CREATE || (!process.env.ADMIN_NO_CREATE && !Accounts.findUserByUsername(process.env.ADMIN_USERNAME || 'admin'))) {
            let userData: CreateUser = {
                username: process.env.ADMIN_USERNAME || 'admin',
                fullName: 'Admin Admin',
                email: process.env.ADMIN_EMAIL || 'admin@localhost',
                password: process.env.ADMIN_PASSWORD ||'42',
                picture: null,
                phone: '00123456789',
                language: 'en',
                state: 'normal',
                roles: ['admin', 'manager']
            };
            let user = Accounts.createUser(userData);
            Meteor.users.update({_id: user}, {$set: {roles: ['admin', 'manager'], state: 'normal', emails: [{address: 'admin@localhost', verified: true}]}});
        }
    }
}

function migrate(name: string, migration: () => void) {
    if (!Migrations.findOne({name: name})) {
        migration();
        Migrations.insert({name: name});
    }
}

interface Migration {
    name: string;
}

export const Migrations = new MongoObservable.Collection<Migration>("migrations");

Meteor.startup(function () {
    Meteor.users._ensureIndex({username: 1});
    Meteor.users._ensureIndex({email: 1});
    ItemStateCollection.rawCollection().createIndex({itemId: 1});
    ItemCollection.rawCollection().createIndex({state: 1, name: 1, description: 1, condition: -1, externalId: 1});
    ReservationCollection.rawCollection().createIndex({start: -1, end: 1});
    ReservationCollection.rawCollection().createIndex({userId: 1, start: -1, end: 1});
    ReservationCollection.rawCollection().createIndex({itemIds: 1, start: -1, end: 1});
    TokenCollection.rawCollection().createIndex({token: 1});
    TokenCollection.rawCollection().createIndex({expiresAt: 1}, {expireAfterSeconds: 0});
    GlobalMessageCollection.rawCollection().createIndex({timestamp: 1});
    FileCollection.rawCollection().createIndex({token: 1});
    FileCollection.rawCollection().createIndex({complete: 1});
    UploadFS.tokens.rawCollection().createIndex({value: 1});
    UploadFS.tokens.rawCollection().createIndex({fileId: 1});
    Migrations.rawCollection().createIndex({name: 1});

    migrate('update-image-thumbnail', () => {
        let pictures = FileCollection.find({store: 'pictures-items'}).fetch();
        let re = /\/([^\/\?]+)\/([^\/\?]+)\/([^\/\?]+)$/;
        let update = Meteor.wrapAsync(FileCollection.rawCollection().update, FileCollection.rawCollection());
        _.forEach(pictures, (picture: Picture) => {
            // ${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}/${name}
            if (!picture.thumbnailUrl) {
                return;
            }
            let match = re.exec(picture.thumbnailUrl);
            if (match === null) {
                console.log("No match for", picture._id, picture.thumbnailUrl);
                return;
            }
            let store = match[1];
            let fileId = match[2];
            let fileName = match[3];
            console.log("Updating", picture._id, picture.url, picture.thumbnailUrl, "=>", {thumbnailId: fileId, thumbnailStore: store});
            update({_id: picture._id}, {$set: {thumbnailId: fileId, thumbnailStore: store}});
        });
    });

    migrate('update-item-picture', () => {
        let items = ItemCollection.find().fetch();
        let re = /([^\/\?]+)\/([^\/\?]+)\/([^\/\?]+);/;
        let update = Meteor.wrapAsync(ItemCollection.rawCollection().update, ItemCollection.rawCollection());
        _.forEach(items, (item: Item) => {
            // ${rootPath}/${UploadFS.config.storesPath}/${storeName}/${path}/${name}
            if (!item.picture) {
                return;
            }
            let match = re.exec(item.picture);
            let file: Picture;
            if (match !== null) {
                file = FileCollection.findOne({_id: match[2]});
                if (!file) {
                    console.log("No file for", match[2]);
                    return;
                }
            } else {
                file = FileCollection.findOne({_id: item.picture});
                if (!file) {
                    console.log("No file for", item.picture);
                    return;
                }
            }
            let picture = `${file.store}/${file._id}/${file.name};${file.thumbnailStore}/${file.thumbnailId}/${file.name}`;
            console.log("Updating", item._id, item.picture, "=>", picture);
            update({_id: item._id}, {$set: {picture: picture}})
        });
    });

    migrate('update-item-status-state', () => {
        let items = ItemCollection.find().fetch();
        let update = Meteor.wrapAsync(ItemCollection.rawCollection().update, ItemCollection.rawCollection());
        _.forEach(items, (item: Item) => {
            if (!(<any>item).status) {
                return;
            }
            console.log("Updating", item._id + ".status --> " + item._id + ".state");
            update({_id: item._id}, {$set: {state: (<any>item).status}, $unset: {status: 1}});
        });
    });

    migrate('update-user-status-state', () => {
        let users = UserCollection.find().fetch();
        let update = Meteor.wrapAsync(UserCollection.rawCollection().update, UserCollection.rawCollection());
        _.forEach(users, (user: User) => {
            if (!(<any>user).status) {
                return;
            }
            console.log("Updating", user._id + ".status --> " + user._id + ".state");
            update({_id: user._id}, {$set: {state: (<any>user).status}, $unset: {status: 1}});
        });
    });
});