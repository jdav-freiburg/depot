import {Meteor} from "meteor/meteor";

import * as _ from 'lodash';
import * as moment from 'moment';
import {User, UserSchema} from "../../../both/models/user.model";
import {Roles} from "./utils";
import SimpleSchema from "simpl-schema";
import {UserCollection} from "../../../both/collections/user.collection";
import {GlobalMessageCollection} from "../../../both/collections/global-message.collection";
import {GlobalMessage} from "../../../both/models/global-message.model";
import {sendAddressVerification, sendPasswordReset} from "./email";
import {TokenCollection} from "../../../both/collections/token.collection";
import {Token} from "../../../both/models/token.model";
import * as util from "util";

Meteor.users.allow({
    insert(userId: string, doc: Meteor.User): boolean {
        if (!userId) {
            return false;
        }
        return Roles.userHasRole(userId, 'admin');
    },
    update(userId, doc: Meteor.User, fieldNames, modifier): boolean {
        if (!userId) {
            return false;
        }
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
        if (!userId) {
            return false;
        }
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

    for (let i = 0; i < user.emails.length; i++) {
        sendAddressVerification(user._id, user.language, user.emails[i].address);
    }
    console.log("Create User: ", user);
    return user;
});

Accounts.validateLoginAttempt(function(options) {
    if (!options.allowed || !options.user) {
        return false;
    }

    let loginWithEMail = null;
    if (options.methodArguments.length > 0 && options.methodArguments[0].user && options.methodArguments[0].user.email) {
        loginWithEMail = options.methodArguments[0].user.email.toLowerCase();
        console.log("Trying to login with email ", loginWithEMail);
    }

    if (options.user.emails.length == 0 ||
        (loginWithEMail && _.some(options.user.emails, (email: Meteor.UserEmail) => email.address.toLowerCase() === loginWithEMail && !email.verified)) ||
        !_.some(options.user.emails, (email: Meteor.UserEmail) => email.verified === true)) {
        console.log("E-Mail(s) not verified: ", options.user.emails);
        throw new Meteor.Error('user-email-not-verified', "user-email-not-verified", _.join(_.map(options.user.emails, (email: Meteor.UserEmail) => email.address), ','));
    }
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
    'users.createAccount'(user: User) {
        new SimpleSchema({
            username: String,
            email: String,
            password: String,
            fullName: String,
            phone: String,
            language: String,
        }).validate(user);
        console.log("addAccount:", user);
        return Accounts.createUser(user);
    },
    'users.resendEmailVerification'({emailOrUsername, email}: { emailOrUsername: string, email: string}): void {
        new SimpleSchema({
            emailOrUsername: String,
            email: {type: SimpleSchema.RegEx.EmailWithTLD, optional: true}
        }).validate({
            emailOrUsername,
            email
        });
        console.log("resend verification email:", this.userId, emailOrUsername, email);

        let user: User = <User>Accounts.findUserByUsername(emailOrUsername);
        let userEmail: Meteor.UserEmail = null;
        if (!user) {
            user = Accounts.findUserByEmail(emailOrUsername);
            if (!user) {
                throw new Meteor.Error(404, "User not found.");
            }

            if (!email) {
                userEmail = _.find(user.emails, email => email.address.toLowerCase() === emailOrUsername.toLowerCase());
            }
        }
        if (!userEmail) {
            if (email) {
                userEmail = _.find(user.emails, checkEmail => !checkEmail.verified && checkEmail.address.toLowerCase() === email.toLowerCase());
            } else if (user.emails.length > 0) {
                userEmail = user.emails[0];
            } else {
                throw new Meteor.Error('no-email', 'no-email');
            }
        }

        if (userEmail.verified) {
            throw new Meteor.Error('already-verified', 'already-verified');
        }

        sendAddressVerification(user._id, user.language, userEmail.address);
    },
    'users.forgotPassword'({emailOrUsername}: { emailOrUsername: string}): void {
        new SimpleSchema({
            emailOrUsername: String,
        }).validate({
            emailOrUsername
        });
        console.log("send password link:", this.userId, emailOrUsername);

        let user: User = <User>Accounts.findUserByUsername(emailOrUsername);
        let userEmail = null;
        if (!user) {
            user = Accounts.findUserByEmail(emailOrUsername);
            if (!user) {
                throw new Meteor.Error(404, "User not found.");
            }

            let userEmailInUser = _.find(user.emails, email => email.address.toLowerCase() === emailOrUsername.toLowerCase());
            if (userEmailInUser && userEmailInUser.verified) {
                userEmail = emailOrUsername;
            }
        }
        if (!userEmail) {
            let userEmailInUser = _.find(user.emails, email => email.verified);
            if (!userEmailInUser) {
                throw new Meteor.Error('no-valid-email', 'no-valid-email');
            }
            userEmail = userEmailInUser.address;
        }

        sendPasswordReset(user._id, user.language, userEmail);
    },
    'users.addEmail'({userId, email}: { userId: string, email: string}): void {
        if (!this.userId) {
            return;
        }
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

        let user: User = UserCollection.findOne(userId);
        if (!user) {
            throw new Meteor.Error('entity', "Invalid user");
        }
        Accounts.addEmail(userId, email, false);
        sendAddressVerification(userId, user.language, email);
        console.log("addedEmail:", this.userId, userId, email);
    },
    'users.setUsername'({userId, name}: {userId: string, name: string}): void {
        if (!this.userId) {
            return;
        }
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
        if (!this.userId) {
            return;
        }
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
        if (!this.userId) {
            return;
        }
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
        let user: User = UserCollection.findOne(userId);
        if (!user) {
            throw new Meteor.Error('entity', "Invalid user");
        }

        Accounts.removeEmail(userId, oldEmail);
        Accounts.addEmail(userId, newEmail, false);
        sendAddressVerification(userId, user.language, newEmail);
    },
    'users.updatePassword'({userId, newPassword, oldPassword}: { userId: string, newPassword: string, oldPassword?: string}): void {
        if (!this.userId) {
            return;
        }
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
    'users.validateEmailToken'({token}: { token: string}): void {
        new SimpleSchema({
            token: /^[0-9a-zA-Z]+$/,
        }).validate({
            token,
        });

        let tokenData = TokenCollection.findOne({token: token});
        if (!tokenData) {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }

        console.log("Token: ", tokenData);

        TokenCollection.remove(tokenData._id);

        if (tokenData.type !== 'email') {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }
        let user: User = UserCollection.findOne(tokenData.userId);
        if (!user) {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }
        console.log("User for token: ", user);
        let emailIdx = _.findIndex(user.emails, (email) => email.address === tokenData.emailAddress);
        if (emailIdx === -1) {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }
        let set = {};
        set['emails.' + emailIdx + '.verified'] = true;
        UserCollection.update(user._id, {$set: set});
        console.log("Email verified");
    },
    'users.resetPasswordToken'({newPassword, token}: { newPassword: string, token: string}): void {
        new SimpleSchema({
            newPassword: String,
            token: /^[0-9a-zA-Z]+$/
        }).validate({
            newPassword,
            token
        });

        let tokenData = TokenCollection.findOne({token: token});
        if (!tokenData) {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }

        console.log("Token: ", tokenData);

        TokenCollection.remove(tokenData._id);

        if (tokenData.type !== 'password') {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }
        let user: User = UserCollection.findOne(tokenData.userId);
        if (!user) {
            throw new Meteor.Error('invalid-token', 'invalid-token');
        }
        console.log("User for token: ", user);
        Accounts.setPassword(user._id, newPassword);
        console.log("Password reset successful");
    },
    'users.setLanguage'({language, userId}: { language: string, userId?: string}): void {
        if (!this.userId) {
            return;
        }
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
        if (!this.userId) {
            return;
        }
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
        if (!this.userId) {
            return;
        }
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