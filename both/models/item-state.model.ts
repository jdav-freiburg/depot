import SimpleSchema from 'simpl-schema';

export const ItemStateSchema = new SimpleSchema({
    timestamp: { type: Date, optional: true },
    itemId: { type: String, optional: true },

    fieldNames: { type: Array, optional: true },
    'fieldNames.$': { type: String },
    fieldValues: { type: Array, optional: true },
    'fieldValues.$': { type: String },

    userId: { type: String, optional: true },

    comment: { type: String, optional: true }
});

export interface ItemState {
    _id?: string;
    timestamp: Date;
    itemId: string;
    fieldNames: string[];
    fieldValues: string[];

    userId: string;

    comment: string;
}
