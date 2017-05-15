import * as _ from 'lodash';
import {UserCollection} from "../../../both/collections/user.collection";
import {User} from "../../../both/models/user.model";



export class Roles {
    public static userHasRole(userId: string|User, roles: string|string[]) {
        let user: User;
        if (_.isString(userId)) {
            user = UserCollection.findOne({_id: userId});
        } else {
            user = <User>userId;
        }
        if (user && user.roles) {
            if (_.isArray(roles)) {
                return user.roles.some((role) => _.includes(roles, role));
            } else {
                return _.includes(user.roles, roles);
            }
        }
        return false;
    }
}