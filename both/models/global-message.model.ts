import SimpleSchema from 'simpl-schema';

export const GlobalMessageSchema = new SimpleSchema({
    timestamp: { type: Date, optional: true },

    type: { type: String, optional: true },

    data: { type: Object, optional: true }
});

export interface GlobalMessage {
    _id?: string;

    timestamp: Date;

    type: string;

    data: {[key: string]: string};
}