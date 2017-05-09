import { Component } from "@angular/core";
import template from "./home.html";
import style from "./home.scss";
import {NavController} from "ionic-angular";

@Component({
    selector: "home-page",
    template: template,
    styles: [ style ]
})
export class HomePage {

    constructor(private navCtrl: NavController) {

    }
}
