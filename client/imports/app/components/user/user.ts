import {Component, Input, NgZone, OnChanges, OnInit, SimpleChanges} from "@angular/core";
import template from "./user.html";
import style from "./user.scss";
import * as _ from "lodash";
import {NavController} from "ionic-angular";
import {User} from "../../../../../both/models/user.model";
import {UserService} from "../../services/user";

@Component({
    selector: "user-ref",
    template,
    styles: [ style ]
})
export class UserComponent implements OnInit, OnChanges {
    @Input() userId: string = "";
    user: User = null;

    constructor(private navCtrl: NavController, private userService: UserService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.user = Meteor.users.findOne({_id: this.userId});
        console.log("Initial user for ", this.userId, ':', this.user);
    }

    ngOnChanges(changes: SimpleChanges) {
        Meteor.users.find({_id: this.userId}).observe((users) => {
            this.ngZone.run(() => {
                if (users.length > 0) {
                    this.user = users[0];
                    console.log("User for ", this.userId, ':', this.user);
                } else {
                    this.user = null;
                }
            });
        });
    }

    openUser() {
        console.log("TODO: Implement user properties");
        //this.navCtrl.push(UserPage)
    }
}
