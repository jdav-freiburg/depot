import { Component } from "@angular/core";
import template from "./tabs.html";
import style from "./tabs.scss";
import {HomePage} from "../home/home";
import {ItemsPage} from "../items/items";
import {ReservationsPage} from "../reservations/reservations";

@Component({
    selector: "tabs-page",
    template: template,
    styles: [ style ]
})
export class TabsPage {
    tabHome = HomePage;
    tabItems = ItemsPage;
    tabReservations = ReservationsPage;

    constructor() {
    }
}
