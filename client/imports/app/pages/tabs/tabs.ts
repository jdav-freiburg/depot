import {Component} from "@angular/core";
import template from "./tabs.html";
import style from "./tabs.scss";
import {HomePage} from "../home/home";
import {ItemsPage} from "../items/items";
import {ReservationsPage} from "../reservations/reservations";
import * as _ from 'lodash';
import {TranslateService} from "../../services/translate";

@Component({
    selector: "tabs-page",
    template: template,
    styles: [ style ]
})
export class TabsPage {
    tabHome = HomePage;
    tabItems = ItemsPage;
    tabReservations = ReservationsPage;

    constructor(private translate: TranslateService) {
    }
}
