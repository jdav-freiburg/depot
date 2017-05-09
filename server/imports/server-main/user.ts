import {Meteor} from "meteor/meteor";

import * as _ from 'lodash';
import {User} from "../../../both/models/user.model";

Meteor.users.allow({
    insert(userId: string, doc: Meteor.User): boolean {
        return Roles.userIsInRole(userId, ['admin'], Roles.GLOBAL_GROUP);
    },
    update(userId, doc: Meteor.User, fieldNames, modifier): boolean {
        if (Roles.userIsInRole(userId, ['admin'], Roles.GLOBAL_GROUP)) {
            return true;
        }
        if (userId !== doc._id) {
            return false;
        }
        return _.difference(fieldNames, ['fullName', 'phone', 'picture']).length === 0;
    },
    remove(userId: string, doc: Meteor.User): boolean {
        return Roles.userIsInRole(userId, ['admin'], Roles.GLOBAL_GROUP);
    }
});

Meteor.publish(null, function() {
    if (this.userId) {
        console.log("register self");
        return Meteor.users.find({_id: this.userId}, {
            fields: {
                'emails': 1,
                'username': 1,
                'fullName': 1,
                'phone': 1,
                'picture': 1
            }
        });
    }
    this.ready();
});

Meteor.publish('users', function() {
    if (this.userId) {
        console.log("register users");
        return Meteor.users.find({}, {fields: {'emails': 1, 'fullName': 1, 'phone': 1, 'picture': 1}});
    }
    this.ready();
});

Accounts.onCreateUser((options: User, user: User) => {
    if (user.services.facebook) {
        user.fullName = user.services.facebook.first_name + " " + user.services.facebook.last_name;
    }
    if (user.services.google) {
        user.fullName = user.services.google.name;
    }
    user.phone = options.phone;
    user.fullName = options.fullName;
    user.picture = options.picture;
    console.log("Create User: ", user);
    return user;
});
