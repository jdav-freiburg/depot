import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";
import { Item } from "../../../../both/models/item.model";
import { ItemCollection } from "../../../../both/collections/item.collection";

import * as _ from 'lodash';
import {ItemState} from "../../../../both/models/item-state.model";
import {ItemStateCollection} from "../../../../both/collections/item-state.collection";

@Injectable()
export class ItemsDataService {
    private items: ObservableCursor<Item>;

    constructor(private ngZone: NgZone) {
        Tracker.autorun(() => {
            Meteor.subscribe('items');
        });
        this.items = ItemCollection.find({});
    }

    public getItems(): ObservableCursor<Item> {
        return this.items;
    }

    public add(item: Item, updateComment: string = "", callback: Function = null): void {
        Meteor.call('items.insert', {
            item: item,
            updateComment: updateComment
        }, (err, res) => {
            console.log("items add", err, res);
            if (!err) {
                item._id = res;
            }
            if (callback) {
                callback(err);
            }
        });
    }

    public update(item: Item, updateComment: string = "", callback: Function = null): void {
        Meteor.call('items.update', {
            item: item,
            updateComment: updateComment
        }, (err, res) => {
            console.log("items update", err, res);
            if (callback) {
                callback(err);
            }
        });
    }

    public getItem(id: string): ObservableCursor<Item> {
        return ItemCollection.find({_id: id});
    }

    public remove(id: string): void {
        ItemCollection.remove({_id: id});
    }
}
