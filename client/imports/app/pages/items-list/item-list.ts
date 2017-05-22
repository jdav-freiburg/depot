import {Component, NgZone, OnDestroy, OnInit, ViewChild, ViewChildren} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-list.html";
import style from "./item-list.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {NavController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserver} from "../../util/query-observer";
import {ItemCardsPage} from "../item-cards/item-cards";

@Component({
    selector: "item-list-page",
    template,
    styles: [ style ]
})
export class ItemListPage implements OnInit, OnDestroy {
    private filter: string = "";

    private items: QueryObserver<Item>;

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.items = new QueryObserver<Item>(this.itemsService.getItems(), this.ngZone, true);
    }

    ngOnDestroy() {
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
    }

    showCards() {
        this.navCtrl.pop();
        this.navCtrl.push(ItemCardsPage);
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }
}
