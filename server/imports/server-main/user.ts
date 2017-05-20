import {Meteor} from "meteor/meteor";

import * as _ from 'lodash';
import {User, UserSchema} from "../../../both/models/user.model";
import {Roles} from "./utils";
import SimpleSchema from "simpl-schema";
import {UserCollection} from "../../../both/collections/user.collection";
import {GlobalMessageCollection} from "../../../both/collections/global-message.collection";
import {GlobalMessage} from "../../../both/models/global-message.model";

Meteor.users.allow({
    insert(userId: string, doc: Meteor.User): boolean {
        return Roles.userHasRole(userId, 'admin');
    },
    update(userId, doc: Meteor.User, fieldNames, modifier): boolean {
        console.log("User Updating", userId, doc, fieldNames, modifier);
        if (Roles.userHasRole(userId, 'admin')) {
            return _.difference(fieldNames, ['fullName', 'phone', 'picture', 'language', 'roles']).length === 0;
        }
        if (userId !== doc._id) {
            return false;
        }
        return _.difference(fieldNames, ['fullName', 'phone', 'picture', 'language']).length === 0;
    },
    remove(userId: string, doc: Meteor.User): boolean {
        return Roles.userHasRole(userId, 'admin');
    }
});

Meteor.publish(null, function() {
    if (this.userId) {
        console.log("register self");
        return Meteor.users.find({_id: this.userId}, {
            fields: {
                'username': 1,
                'emails': 1,
                'fullName': 1,
                'phone': 1,
                'picture': 1,
                'language': 1,
                'status': 1,
                'roles': 1,
            }
        });
    }
    this.ready();
});

Meteor.publish('users', function() {
    if (this.userId) {
        console.log("register users");
        return Meteor.users.find({}, {
            fields: {
                'username': 1,
                'emails': 1,
                'fullName': 1,
                'phone': 1,
                'picture': 1,
                'language': 1,
                'status': 1,
                'roles': 1
            }
        });
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
    UserSchema.validate({
        phone: options.phone,
        fullName: options.fullName,
        picture: options.picture,
    });
    user.phone = options.phone;
    user.fullName = options.fullName;
    user.picture = options.picture;
    user.language = options.language;
    user.status = "locked";
    user.roles = [];
    console.log("Create User: ", user);
    return user;
});

Accounts.validateLoginAttempt(function(options) {
    if (!options.allowed || !options.user) {
        return false;
    }

    /*if (options.user.emails.length == 0 || _.any(options.user.emails, email.verified === true)) {
        throw new Meteor.Error('user-email-not-verified', "user-email-not-verified", _.map(options.user.emails, email -> email.address));
    }*/
    if (options.user.status === 'locked') {
        throw new Meteor.Error('user-locked', "user-locked");
    }
    if (options.user.status === 'disabled') {
        throw new Meteor.Error('user-disabled', "user-disabled");
    }
    if (options.user.status === 'deleted') {
        return false;
    }
    if (options.user.status !== 'normal') {
        throw new Meteor.Error('status', "user-status-not-normal", options.user.status);
    }
    return true;
});

Meteor.methods({
    'users.addEmail'({userId, email}: { userId: string, email: string}): void {
        console.log("addEmail:", this.userId, userId, email);
        new SimpleSchema({
            userId: String,
            email: SimpleSchema.RegEx.EmailWithTLD
        }).validate({
            userId,
            email,
        });

        if (userId !== this.userId && !Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }

        console.log("addingEmail:", this.userId, userId, email);
        Accounts.addEmail(userId, email, false);
        console.log("addedEmail:", this.userId, userId, email);
    },
    'users.setUsername'({userId, name}: {userId: string, name: string}): void {
        new SimpleSchema({
            userId: String,
            name: String
        }).validate({
            userId,
            name,
        });

        if (!Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }

        Accounts.setUsername(userId, name);
    },
    'users.removeEmail'({userId, email}: { userId: string, email: string}): void {
        new SimpleSchema({
            userId: String,
            email: String
        }).validate({
            userId,
            email,
        });

        if (userId !== this.userId && !Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }

        Accounts.removeEmail(userId, email);
    },
    'users.updateEmail'({userId, oldEmail, newEmail}: { userId: string, oldEmail: string, newEmail: string}): void {
        new SimpleSchema({
            userId: String,
            oldEmail: String,
            newEmail: SimpleSchema.RegEx.EmailWithTLD
        }).validate({
            userId,
            oldEmail,
            newEmail
        });

        if (userId !== this.userId && !Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }

        Accounts.removeEmail(userId, oldEmail);
        Accounts.addEmail(userId, newEmail, false)
    },
    'users.updatePassword'({userId, newPassword, oldPassword}: { userId: string, newPassword: string, oldPassword?: string}): void {
        new SimpleSchema({
            userId: String,
            newPassword: String,
            oldPassword: {type: String, optional: true}
        }).validate({
            userId,
            newPassword,
            oldPassword
        });

        if (userId === this.userId) {
            new SimpleSchema({
                oldPassword: String
            }).validate({
                oldPassword
            });
            Accounts.changePassword(oldPassword, newPassword);
        } else if (Roles.userHasRole(this.userId, 'admin')) {
            Accounts.setPassword(userId, newPassword);
        } else {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }
    },
    'users.setLanguage'({language, userId}: { language: string, userId?: string}): void {
        new SimpleSchema({
            language: String,
            userId: {type: String, optional: true},
        }).validate({
            language,
            userId,
        });

        if ((userId && userId !== this.userId) && !Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }
        UserCollection.update({_id: userId || this.userId}, {$set: {language: language}});
    },
    'users.unlock'({userId}: { userId: string}): void {
        new SimpleSchema({
            userId: userId,
        }).validate({
            userId,
        });
        let user = UserCollection.findOne({_id: userId});
        if (!user) {
            throw new Meteor.Error('entity', "Invalid user");
        }
        if (user.status === 'normal') {
            return;
        }
        if (user.status !== 'locked') {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }
        UserCollection.update({_id: userId}, {$set: {status: 'normal'}});
        let globalMessage: GlobalMessage = {
            timestamp: new Date(),
            type: "new-user",
            data: {
                authenticatorUserId: this.userId,
                userId: userId
            }
        };
        GlobalMessageCollection.insert(globalMessage);
    },
    'users.setStatus'({status, userId}: { status: string, userId: string}): void {
        new SimpleSchema({
            status: String,
            userId: userId,
        }).validate({
            status,
            userId,
        });

        if (!Roles.userHasRole(this.userId, 'admin')) {
            throw new Meteor.Error('unauthorized', "Not allowed to modify other user");
        }
        if (status === 'deleted') {
            UserCollection.update({_id: userId}, {$set: {status: status, username: null, emails: []}});
        } else {
            UserCollection.update({_id: userId}, {$set: {status: status}});
        }
    },
});