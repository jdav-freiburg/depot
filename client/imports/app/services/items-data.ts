import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";
import {Item} from "../../../../both/models/item.model";
import { ItemCollection } from "../../../../both/collections/item.collection";

import * as _ from 'lodash';
import {TranslateOption, TranslateService} from "./translate";
import {colors} from "../colors";

@Injectable()
export class ItemsDataService {
    constructor(private ngZone: NgZone, private translate: TranslateService) {
        Tracker.autorun(() => {
            Meteor.subscribe('items');
        });
    }

    get itemConditionOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'ITEM.CONDITION.GOOD',
                value: "good",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'ITEM.CONDITION.BAD',
                value: "bad",
                color: 'warning',
                colorCss: colors.warning,
                text: ""
            },
            {
                translate: 'ITEM.CONDITION.BROKEN',
                value: "broken",
                color: 'danger',
                colorCss: colors.danger,
                text: ""
            }
        ]);
    }

    get itemStatusOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'ITEM.STATUS.PUBLIC',
                value: "public",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'ITEM.STATUS.HIDDEN',
                value: "hidden",
                color: 'danger',
                colorCss: colors.danger,
                text: ""
            }
        ]);
    }

    public getItems(): ObservableCursor<Item> {
        return ItemCollection.find({}, {sort: {name: 1, description: 1, condition: -1, _id: 1}});
    }

    public getPublicItems(): ObservableCursor<Item> {
        return ItemCollection.find({status: 'public'}, {sort: {name: 1, description: 1, condition: -1, _id: 1}});
    }

    public getItemList(itemIds: string[]): ObservableCursor<Item> {
        return ItemCollection.find({_id: {$in: itemIds}});
    }

    public add(item: Item, updateComment: string = "", callback: Function = null): void {
        Meteor.call('items.insert', {
            item: item,
            updateComment: updateComment
        }, (err, res) => {
            this.ngZone.run(() => {
                console.log("items add", err, res);
                if (!err) {
                    item._id = res;
                }
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public update(item: Item, updateComment: string = "", callback: Function = null): void {
        Meteor.call('items.update', {
            item: item,
            updateComment: updateComment
        }, (err, res) => {
            this.ngZone.run(() => {
                console.log("items update", err, res);
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }

    public getItem(id: string): ObservableCursor<Item> {
        return ItemCollection.find({_id: id});
    }

    public remove(id: string, callback?: Function): void {
        Meteor.call('items.remove', {
            itemId: id
        }, (err, res) => {
            this.ngZone.run(() => {
                console.log("reservation remove:", err, res);
                if (callback) {
                    callback(err, res);
                }

            });
        });
    }

    addAll(items: Item[], updateComment: string, callback?: Function) {
        Meteor.call('items.addAll', {
            items,
            updateComment
        }, (err, res) => {
            this.ngZone.run(() => {
                console.log("items update", err, res);
                if (callback) {
                    callback(err, res);
                }
            });
        });
    }
}
