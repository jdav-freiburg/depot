import {Component, NgZone, OnDestroy, OnInit, ViewChild, ViewChildren} from "@angular/core";
import {ItemsDataService} from "../../services/items-data";
import {Item} from "../../../../../both/models/item.model";
import template from "./item-cards.html";
import style from "./item-cards.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {NavController} from "ionic-angular";
import {TranslateService} from "../../services/translate";
import {QueryObserver, QueryObserverTransform} from "../../util/query-observer";
import {ItemListPage} from "../items-list/item-list";

@Component({
    selector: "item-cards-page",
    template,
    styles: [ style ]
})
export class ItemCardsPage implements OnInit, OnDestroy {
    private filter: string = "";

    private items: QueryObserverTransform<Item, Item>;

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.items = new QueryObserverTransform<Item, Item>(this.itemsService.getItems(), this.ngZone, (item) => {
            if (item) {
                return item;
            } else {
                return {
                    _id: null,
                    externalId: "",
                    name: "",

                    description: "",

                    condition: "good",
                    conditionComment: "",

                    purchaseDate: new Date(),
                    lastService: new Date(),

                    picture: null,

                    tags: [],

                    itemGroup: null,

                    status: "public"
                };
            }
        }, true);
    }

    ngOnDestroy() {
        if (this.items) {
            this.items.unsubscribe();
            this.items = null;
        }
    }

    showList() {
        this.navCtrl.pop();
        this.navCtrl.push(ItemListPage);
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }
}
