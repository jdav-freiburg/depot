import {AfterViewInit, Component, NgZone, OnDestroy, ViewChild} from "@angular/core";
import template from "./tabs.html";
import style from "./tabs.scss";
import {HomePage} from "../home/home";
import {ItemsPage} from "../items/items";
import {ReservationsPage} from "../reservations/reservations";
import {TranslateService} from "@ngx-translate/core";
import * as _ from 'lodash';
import {Subscription} from "rxjs/Subscription";
import {Tabs} from "ionic-angular";

@Component({
    selector: "tabs-page",
    template: template,
    styles: [ style ]
})
export class TabsPage implements OnDestroy, AfterViewInit {
    tabHome = HomePage;
    tabItems = ItemsPage;
    tabReservations = ReservationsPage;

    @ViewChild("tabsView") tabsView: Tabs;

    tabs = [
        {
            root: HomePage,
            translate: "TABS.HOME",
            text: "",
            icon: "home",
            visible: true
        },
        {
            root: ItemsPage,
            translate: "TABS.ITEMS",
            text: "",
            icon: "list",
            visible: true
        },
        {
            root: ReservationsPage,
            translate: "TABS.RESERVATIONS",
            text: "",
            icon: "calendar",
            visible: true
        }
    ];

    translateSubscription: Subscription;

    constructor(private translate: TranslateService, private zone: NgZone) {
    }

    ngOnDestroy() {
        if (this.translateSubscription) {
            this.translateSubscription.unsubscribe();
            this.translateSubscription = null;
        }
    }

    ngAfterViewInit() {
        this.translateSubscription = this.translate.get(_.map(this.tabs, (key) => key.translate)).subscribe((texts) => {
            this.zone.run(() => {
                _.forEach(this.tabs, (tab) => {
                    tab.text = texts[tab.translate];
                    tab.visible = true;
                });
                console.log("Tabs:", this.tabs);
            });
        });
    }
}
