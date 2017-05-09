import './user.ts';
import './item.ts';
import './reservation.ts';
import {CreateUser, User} from "../../../both/models/user.model";

export class Main {
    start(): void {
        this.initFakeData();
    }

    initFakeData(): void {
        if (Accounts.findUserByUsername('admin')) {
            Meteor.users.remove({'username': 'admin'});
        }
        if (!Accounts.findUserByUsername('admin')) {
            let userData: CreateUser = {
                username: 'admin',
                fullName: 'Admin Admin',
                email: 'admin@localhost',
                password: '42',
                picture: null,
                phone: '00123456789'
            };
            let user: User = Accounts.createUser(userData);
            Roles.addUsersToRoles(user, ['admin', 'manager'], Roles.GLOBAL_GROUP);
        }
    }
}
