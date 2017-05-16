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
export class UsersPage implements OnInit, OnDestroy {
    filter: string = "";

    users: Observable<User[]>;
    private usersHandle: Subscription;

    get isAdmin(): boolean {
        return this.userService.isAdmin;
    }

    constructor(private navCtrl: NavController, private ngZone: NgZone, private userService: UserService) {
        this.usersHandle = userService.usersChange.subscribe((users) => {
            console.log("users:", users);
        });
    }

    ngOnInit() {
        this.users = this.userService.usersChange.asObservable();
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
}
