import SimpleSchema from 'simpl-schema';
import {ItemSchema} from "./item.model";

export const ItemStateSchema = new SimpleSchema({
    timestamp: { type: Date, optional: true },
    itemId: { type: String, optional: true },

    fields: { type: ItemSchema, optional: true },

    userId: { type: String, optional: true },

    comment: { type: String, optional: true }
});

export interface ItemState {
    _id?: string;
    timestamp: Date;
    itemId: string;
    fields: {[key: string]: any};

    userId: string;

    comment: string;
}
