import SimpleSchema from 'simpl-schema';

export const GroupSchema = new SimpleSchema({
    name: { type: String, optional: true },

    state: { type: String, optional: true },

    admins: { type: Array, optional: true },
    'admins.$': { type: String },
    users: { type: Array, optional: true },
    'users.$': { type: String },
});

export interface Group {
    _id?: string;

    name: string;

    state: string;

    admins: string[];
    users: string[];
}