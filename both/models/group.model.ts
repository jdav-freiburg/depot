import SimpleSchema from 'simpl-schema';

export const GroupSchema = new SimpleSchema({
    name: { type: String, optional: true },

    status: { type: String, optional: true },

    admins: { type: Array, optional: true },
    'admins.$': { type: String },
    users: { type: Array, optional: true },
    'users.$': { type: String },
});

export interface Group {
    _id?: string;

    name: string;

    status: string;

    admins: string[];
    users: string[];
}