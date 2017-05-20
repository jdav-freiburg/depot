import { Meteor } from 'meteor/meteor';

import SimpleSchema from 'simpl-schema';

export const UserSchema = new SimpleSchema({
    fullName: { type: String, optional: true },
    picture: { type: String, optional: true },
    phone: { type: String, optional: true },
    language: { type: String, optional: true },
    roles: { type: Array, optional: true },
    'roles.$': { type: String },
});

export interface User extends Meteor.User {
    fullName?: string;
    picture?: string;
    phone?: string;
    language?: string;
    status?: string;
    roles?: string[];
}

export interface CreateUser {
    username?: string;
    email?: string;
    password?: string;
    profile?: Object;
    fullName?: string;
    picture?: string;
    phone?: string;
    language?: string;
    status?: string;
    roles?: string[];
}