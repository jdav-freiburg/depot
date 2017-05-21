import {Component, NgZone, OnDestroy, OnInit} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./items.html";
import style from "./items.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {NavController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserver} from "../../util/query-observer";

@Component({
    selector: "items-page",
    template,
    styles: [ style ]
})
export class ItemsPage implements OnInit, OnDestroy {
    private filter: string = "";

    private items: QueryObserver<Item>;

    constructor(private itemsDataService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.items = new QueryObserver<Item>(this.itemsDataService.getItems(), this.ngZone, true);
    }

    ngOnDestroy() {
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }
}
