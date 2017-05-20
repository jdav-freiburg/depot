import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";
import {Item} from "../../../../both/models/item.model";
import { ItemCollection } from "../../../../both/collections/item.collection";

import * as _ from 'lodash';
import {TranslateOption, TranslateService} from "./translate";
import {colors} from "../colors";

@Injectable()
export class ItemsDataService {
    private items: ObservableCursor<Item>;

    constructor(private ngZone: NgZone, private translate: TranslateService) {
        Tracker.autorun(() => {
            Meteor.subscribe('items');
        });
        this.items = ItemCollection.find({});
    }

    get itemConditionOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'ITEM.CONDITION.100',
                value: "100",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'ITEM.CONDITION.50',
                value: "50",
                color: 'warning',
                colorCss: colors.warning,
                text: ""
            },
            {
                translate: 'ITEM.CONDITION.0',
                value: "0",
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
        return this.items;
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

    public remove(id: string): void {
        ItemCollection.remove({_id: id});
    }
}
