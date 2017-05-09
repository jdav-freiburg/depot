import { Meteor } from 'meteor/meteor';

export interface User extends Meteor.User {
    fullName?: string;
    picture?: string;
    phone?: string;
}

export interface CreateUser {
    username?: string;
    email?: string;
    password?: string;
    profile?: Object;
    fullName?: string;
    picture?: string;
    phone?: string;
}