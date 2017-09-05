import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import template from "./users.html";
import style from "./users.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {NavController} from "ionic-angular";
import {UserModal} from "../user-modal/user-modal";
import {User} from "../../../../../both/models/user.model";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: "users-page",
    template,
    styles: [ style ]
})
export class UsersPage implements OnDestroy {
    filter: string = "";

    private users: User[];
    displayUsers: User[];
    private usersHandle: Subscription;

    private filterQuery: string[];

    get isAdmin(): boolean {
        return this.userService.isAdmin;
    }

    checkFilters(user: User, query): boolean {
        for (let i = 0; i < query.length; i++) {
            let any = false;
            for (let j = 0; j < user.filters.length; j++) {
                if (user.filters[j].indexOf(query[i]) !== -1) {
                    any = true;
                    break;
                }
            }
            if (!any) {
                return false;
            }
        }
        return true;
    }

    constructor(private navCtrl: NavController, private ngZone: NgZone, private userService: UserService) {
        this.usersHandle = userService.usersChange.subscribe((users) => {
            console.log("users:", users);
            this.users = users;
            this.filterChange();
        });
    }

    getUserRoleOption(role: string) {
        return this.userService.getUserRoleOption(role);
    }

    ngOnDestroy() {
        if (this.usersHandle) {
            this.usersHandle.unsubscribe();
            this.usersHandle = null;
        }
    }

    newItem() {
        this.navCtrl.push(UserModal);
    }

    editItem(id: string) {
        this.navCtrl.push(UserModal, {userId: id});
    }

    filterChange() {
        this.filterQuery = this.filter.toLowerCase().split(/\s+/);
        if (this.filter.length < 3) {
            this.displayUsers = this.users;
        } else {
            this.displayUsers = _.filter(this.users, (user) => this.checkFilters(user, this.filterQuery));
        }
        console.log("Result:", this.displayUsers);
    }
}
