import {Component, OnDestroy, OnInit} from "@angular/core";
import { Observable } from "rxjs";
import template from "./items-importer.html";
import style from "./items-importer.scss";
import * as _ from "lodash";
import {UserService} from "../../services/user";
import {ReservationsDataService} from "../../services/reservations-data";
import {Reservation} from "../../../../../both/models/reservation.model";
import {AlertController, NavController, ToastController} from "ionic-angular";
import {ReservationPage} from "../reservation/reservation";
import {Subscription} from "rxjs/Subscription";
import * as moment from 'moment';
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {FormGroup, FormBuilder, Validators} from "@angular/forms";

import * as Baby from 'babyparse';

@Component({
    selector: "items-importer-page",
    template,
    styles: [ style ]
})
export class ItemsImporterPage implements OnInit, OnDestroy {
    items: Item[] = null;

    filter: string = "";

    editItemId: string = null;

    uploadForm: FormGroup;

    isWorking: boolean = false;

    constructor(private fb: FormBuilder,
                private itemsDataService: ItemsDataService, private userService: UserService,
                private navCtrl: NavController, private translate: TranslateService, private toast: ToastController,
                private translateHelper: TranslateHelperService) {
        this.uploadForm = fb.group({
            file: ["", Validators.required],
        });
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    fileDrop(data) {
        console.log("Drop:", data);
        let result = Baby.parse(data).data;
        let isFirst = true;
        let first = result.splice(0, 1)[0];
        console.log("First entry:", first);
        console.log("Second entry:", result[1]);
        this.items = _.map(result, entry => {
            let purchaseDate;
            if (entry[6] && (<string>entry[6]).length == 4) {
                purchaseDate = moment(entry[6], "YYYY")
            } else {
                purchaseDate = moment(entry[6], "DD.MM.YYYY");
            }
            let lastService = moment(entry[7], "DD.MM.YYYY");
            return {
                _id: <string>entry[0],
                externalId: <string>entry[1],
                name: <string>entry[2],

                description: <string>entry[3],

                condition: <string>entry[4],
                conditionComment: <string>entry[5],

                purchaseDate: purchaseDate.isValid()?purchaseDate.toDate():null,
                lastService: lastService.isValid()?lastService.toDate():null,

                picture: null,

                tags: _.map(_.split(<string>entry[8], ","), str => str.trim()),

                status: <string>entry[9]
            };
        });
    }

    getTags(tags: string): string[] {
        if (_.trim(tags) === "") {
            return [];
        }
        return _.map(_.split(tags, ','), (tag) => _.trim(tag));
    }

    get isManager(): boolean {
        return this.userService.isManager;
    }

    save() {
        this.isWorking = true;
        this.itemsDataService.addAll(this.items, (err, res) => {
            this.isWorking = false;
            if (err) {
                console.log("Error:", err);
                this.toast.create({
                    message: this.translateHelper.getError(err),
                    duration: 2500
                }).present();
            }
        });
    }
}
