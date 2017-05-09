import {Item} from "./item.model";
import {Meteor} from "meteor/meteor";

export interface ItemState {
    _id?: string;
    itemId: string;
    fieldNames: string[];
    fieldValues: string[];

    userId: string;

    comment: string;
}
