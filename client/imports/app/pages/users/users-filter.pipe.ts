import { Pipe, PipeTransform } from '@angular/core';
import * as _ from 'lodash';
import {User} from "../../../../../both/models/user.model";

@Pipe({
    name: 'usersfilter',
    pure: false
})
export class UsersFilterPipe implements PipeTransform {
    transform(user: User[], filter: string): any {
        if (!user || !filter) {
            return user;
        }
        let lowercaseFilter = filter.toLowerCase();
        return user.filter(user => (user.username && user.username.toLowerCase().indexOf(lowercaseFilter) !== -1) ||
            user.fullName.toLowerCase().indexOf(lowercaseFilter) !== -1 ||
            _.some(user.emails, (email) => email.address.toLowerCase().indexOf(lowercaseFilter) !== -1) ||
            user.phone.toLowerCase().indexOf(lowercaseFilter) !== -1);
    }
}