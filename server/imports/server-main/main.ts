import './user.ts';
import './item.ts';
import './reservation.ts';
import './globalMessages.ts';
import {CreateUser, User} from "../../../both/models/user.model";

export class Main {
    start(): void {
        this.initFakeData();
    }

    initFakeData(): void {
        /*if (Accounts.findUserByUsername('admin')) {
            Meteor.users.remove({'username': 'admin'});
        }*/
        if (!Accounts.findUserByUsername('admin')) {
            let userData: CreateUser = {
                username: 'admin',
                fullName: 'Admin Admin',
                email: 'admin@localhost',
                password: '42',
                picture: null,
                phone: '00123456789',
                language: 'en',
                status: 'normal',
                roles: ['admin', 'manager']
            };
            let user = Accounts.createUser(userData);
            Meteor.users.update({_id: user}, {$set: {roles: ['admin', 'manager'], status: 'normal'}});
        }
    }
}
