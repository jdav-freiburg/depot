import SimpleSchema from 'simpl-schema';

export const ReservationSchema = new SimpleSchema({
    type: { type: Date, optional: true },
    name: { type: String, optional: true },

    start: { type: Date, optional: true },
    end: { type: Date, optional: true },

    userId: { type: String, optional: true },

    groupId: { type: String, optional: true },

    contact: { type: String, optional: true },

    itemIds: { type: Array, optional: true },
    'itemIds.$': { type: String },
});

export interface Reservation {
    _id?: string;

    type: string;
    name: string;
    start: Date;
    end: Date;

    userId: string;

    groupId: string;

    contact: string;

    itemIds: string[];
}