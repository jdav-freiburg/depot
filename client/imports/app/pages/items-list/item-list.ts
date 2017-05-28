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
import {ChangeableDataTransform, QueryObserverTransform} from "../../util/query-observer";
import {ItemCardsPage} from "../item-cards/item-cards";
import {ExtendedItem, FilterItem, SelectableItemSingle} from "../../util/item";

@Component({
    selector: "item-list-page",
    template,
    styles: [ style ]
})
export class ItemListPage implements OnInit, OnDestroy {
    private filter: string = "";

    private items: QueryObserverTransform<Item, FilterItem>;

    headerFn(rec, idx) {
        return idx === 0 ? true : null;
    }

    constructor(private itemsService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private ngZone: NgZone) {
    }

    ngOnInit() {
        this.items = new QueryObserverTransform<Item, FilterItem>(this.itemsService.getItems(), this.ngZone, (item) => {
            if (!item) {
                return null;
            }
            let transformed: FilterItem = (<ChangeableDataTransform<Item, FilterItem>>item)._transformed;
            if (transformed) {
                transformed.updateFrom(item, this.translate);
            } else {
                transformed = new ExtendedItem(item, this.translate);
            }
            return transformed;
        }, false);
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
