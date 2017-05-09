import {Injectable, NgZone} from "@angular/core";
import {MeteorObservable, ObservableCursor} from "meteor-rxjs";
import { Item } from "../../../../both/models/item.model";
import { ItemCollection } from "../../../../both/collections/item.collection";

import * as _ from 'lodash';

@Injectable()
export class ItemsDataService {
    private items: ObservableCursor<Item>;

    constructor(private ngZone: NgZone) {
        Tracker.autorun(() => {
            Meteor.subscribe('items');
        });
        this.items = ItemCollection.find({});
        this.items.subscribe((x) => {
            console.log("subscribe", x);
        });
        this.items.observe((x) => {
            console.log("observe", x);
        });
    }

    public getItems(): ObservableCursor<Item> {
        return this.items;
    }

    public add(item: Item): void {
        ItemCollection.insert(item);
    }

    public update(item: Item): void {
        let itemData = _.pick(item, ['externalId', 'name', 'description', 'condition', 'conditionComment', 'lastService',
            'picture', 'tags', 'status']);
        ItemCollection.update({_id: item._id}, {$set: itemData}, (error) => {
            console.log(error);
        });
    }

    public remove(id: string): void {
        ItemCollection.remove({_id: id});
    }
}
