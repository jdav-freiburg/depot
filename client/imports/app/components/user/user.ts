import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import template from "./user.html";
import style from "./user.scss";
import * as _ from "lodash";
import {NavController} from "ionic-angular";
import {User} from "../../../../../both/models/user.model";
import {UserService} from "../../services/user";
import {UserModal} from "../../pages/user-modal/user-modal";
import {Subscription} from "rxjs/Subscription";

@Component({
    selector: "user-ref",
    template,
    styles: [ style ]
})
export class UserComponent implements OnInit, OnChanges, OnDestroy {
    @Input() userId: string = "";
    user: User = null;
    private userSubscription: Subscription;

    constructor(private navCtrl: NavController, private userService: UserService) {
    }

    ngOnInit() {
        this.register();
    }

    register() {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
            this.userSubscription = null;
        }
        this.userSubscription = this.userService.usersChange.subscribe((users) => {
            this.user = _.find(users, (user) => user._id === this.userId);
        });
    }

    ngOnDestroy() {
        if (this.userSubscription) {
            this.userSubscription.unsubscribe();
            this.userSubscription = null;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.register();
    }

    openUser() {
        this.navCtrl.push(UserModal, {
            userId: this.userId
        });
    }
}
