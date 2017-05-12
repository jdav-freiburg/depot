import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";
import { Item } from "../../../../both/models/item.model";
import { ItemCollection } from "../../../../both/collections/item.collection";

import * as _ from 'lodash';
import {ItemState} from "../../../../both/models/item-state.model";
import {ItemStateCollection} from "../../../../both/collections/item-state.collection";

class UpdateState {
    updateState: ItemState;
    valueRef: Item;
    updateData: {[key: string]: any} = {};

    constructor(itemRef: Item, updateComment: string) {
        this.valueRef = itemRef;
        this.updateState = {
            timestamp: new Date(),
            itemId: itemRef._id,
            fieldNames: [],
            fieldValues: [],

            userId: Meteor.userId(),

            comment: updateComment
        };
    }

    public setValue(name: string, value: any, valueStr: string = null) {
        if (this.valueRef[name] !== value) {
            this.updateData[name] = value;
            this.updateState.fieldNames.push(name);
            this.updateState.fieldValues.push(valueStr === null ? value : valueStr);
        }
    }
}

@Injectable()
export class ItemsDataService {
    private items: ObservableCursor<Item>;

    constructor(private ngZone: NgZone) {
        Tracker.autorun(() => {
            Meteor.subscribe('items');
            Meteor.subscribe('itemStates');
        });
        this.items = ItemCollection.find({});
    }

    public getItems(): ObservableCursor<Item> {
        return this.items;
    }

    public add(item: Item, updateComment: string = ""): void {
        ItemCollection.insert(item).subscribe((result) => {
            item._id = result;
            let itemState: ItemState = {
                timestamp: new Date(),
                itemId: item._id,
                fieldNames: ['_id', 'externalId', 'name', 'description', 'condition', 'conditionComment', 'lastService', 'tags', 'status'],
                fieldValues: [item._id, item.externalId, item.name, item.description, item.condition, item.conditionComment, item.lastService.toISOString(), item.tags.join(","), item.status],

                userId: Meteor.userId(),

                comment: updateComment
            };
            ItemStateCollection.insert(itemState);
        })
    }

    public update(item: Item, updateComment: string = "", callback: Function = null): void {
        let itemData = _.pick(item, ['externalId', 'name', 'description', 'condition', 'conditionComment', 'lastService',
            'picture', 'tags', 'status']);
        let itemRef = ItemCollection.findOne({_id: item._id});
        let updateState = new UpdateState(itemRef, updateComment);
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
        let result = ItemCollection.update({_id: item._id}, {$set: updateState.updateData});
        result.subscribe((result) => {
            if (result === 1) {
                ItemStateCollection.insert(updateState.updateState).subscribe((result) => {
                    if (callback) {
                        if (result) {
                            callback();
                        } else {
                            callback('Item state not stored');
                        }
                    }
                });
                callback();
            } else if (callback) {
                callback('Item not stored');
            }
        }, (error) => {
            console.log("item update error:", error);
            if (callback) {
                callback(error);
            }
        });
    }

    public getItem(id: string): ObservableCursor<Item> {
        return ItemCollection.find({_id: id});
    }

    public remove(id: string): void {
        ItemCollection.remove({_id: id});
    }

    public getStates(itemId: string): ObservableCursor<ItemState> {
        return ItemStateCollection.find({itemId: itemId});
    }
}
