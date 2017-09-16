import {Component, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from "@angular/core";
import template from "./reservation-card.html";
import style from "./reservation-card.scss";
import * as _ from "lodash";
import {AlertController, NavController, ToastController} from "ionic-angular";
import {Subscription} from "rxjs/Subscription";
import {Item} from "../../../../../both/models/item.model";
import {ItemsDataService} from "../../services/items-data";
import {ItemStateModal} from "../../pages/item-state-modal/item-state-modal";
import {Reservation} from "../../../../../both/models/reservation.model";
import {ReservationsDataService} from "../../services/reservations-data";
import {ReservationPage} from "../../pages/reservation/reservation";
import {TranslateService} from "../../services/translate";
import {TranslateHelperService} from "../../services/translate-helper";
import {UserService} from "../../services/user";
import * as moment from 'moment';
import {ExtendedItem} from "../../util/item";
import {QueryObserverTransform} from "../../util/query-observer";
import {PictureService} from "../../services/picture";
import {ImagePreviewModal} from "../../pages/image-preview-modal/image-preview-modal";

class ItemWithImage extends ExtendedItem {
    public pictureUrl: string;

    public constructor(item: Item, translate: TranslateService) {
        super(item, translate);
    }
}

@Component({
    selector: "reservation-card",
    template,
    styles: [ style ]
})
export class ReservationCardComponent implements OnInit, OnChanges, OnDestroy {
    @Input() reservationId: string = "";
    @Input() reservation: Reservation = null;
    @Input() view: string = "cards";
    items: ItemWithImage[] = [];
    private itemsSubscription: QueryObserverTransform<Item, ItemWithImage>;
    private itemsSubscriptionSubscription: Subscription;
    private reservationSubscription: Subscription;

    private get viewList() {
        return this.view == 'list';
    }

    private get viewListHeader() {
        return this.view == 'listHeader';
    }

    private get viewCards() {
        return this.view == 'cards';
    }

    private get viewItems() {
        return this.view == 'items';
    }

    private get descriptionData() {
        return {
            name: this.reservation.name,
            start: this.reservation.start,
            end: this.reservation.end,
            type: _.find(this.reservationsService.reservationTypeOptions, option => option.value == this.reservation.type),
            contact: this.reservation.contact
        };
    }

    constructor(private navCtrl: NavController, private itemsService: ItemsDataService,
                private reservationsService: ReservationsDataService, private translate: TranslateService,
                private alertCtrl: AlertController, private toast: ToastController,
                private translateHelper: TranslateHelperService, private users: UserService, private zone: NgZone,
                private pictureService: PictureService) {
    }

    ngOnInit() {
        this.register();
    }

    refreshItems() {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = null;
        }
        if (this.itemsSubscriptionSubscription) {
            this.itemsSubscriptionSubscription.unsubscribe();
            this.itemsSubscriptionSubscription = null;
        }
        if (this.reservation) {
            this.itemsSubscription = new QueryObserverTransform<Item, ItemWithImage>({
                query: this.itemsService.getPublicItems(),
                zone: this.zone,
                transformer: (item, transformed: ItemWithImage) => {
                    if (transformed) {
                        transformed.updateFrom(item, this.translate);
                    } else {
                        transformed = new ItemWithImage(item, this.translate);
                    }
                    if (transformed.picture) {
                        transformed.pictureUrl = this.pictureService.getPictureThumbnailUrl(transformed.picture);
                    }
                    return transformed;
                },
            });
            this.itemsSubscriptionSubscription = this.itemsSubscription.dataChanged.subscribe((items) => {
                this.items = items;
                console.log("Items:", this.items);
            });
        } else {
            this.items = [];
        }
    }

    register() {
        if (this.reservationSubscription) {
            this.reservationSubscription.unsubscribe();
            this.reservationSubscription = null;
        }
        if (this.reservationId) {
            this.reservationSubscription = this.reservationsService.getReservation(this.reservationId).zone().subscribe((reservations) => {
                this.reservation = null;
                if (reservations.length > 0) {
                    this.reservation = reservations[0];
                    console.log("Reservation for", this.reservationId, this.reservation);
                }
                this.refreshItems();
            });
        }
    }

    ngOnDestroy() {
        if (this.itemsSubscription) {
            this.itemsSubscription.unsubscribe();
            this.itemsSubscription = null;
        }
        if (this.itemsSubscriptionSubscription) {
            this.itemsSubscriptionSubscription.unsubscribe();
            this.itemsSubscriptionSubscription = null;
        }
        if (this.reservationSubscription) {
            this.reservationSubscription.unsubscribe();
            this.reservationSubscription = null;
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        this.register();
        this.refreshItems();
    }

    openItem(item: Item) {
        this.navCtrl.push(ItemStateModal, {
            itemId: item._id,
            skipReservationId: this.reservation._id,
            rangeStart: this.reservation.start,
            rangeEnd: this.reservation.end,
        });
    }

    openItemPicture(item: Item) {
        this.navCtrl.push(ImagePreviewModal, {
            picture: item.picture,
            title: item.name
        });
    }

    editReservation() {
        this.navCtrl.push(ReservationPage, {reservationId: this.reservation._id});
    }

    get isOwner(): boolean {
        return this.users.user && this.users.user._id === this.reservation.userId;
    }

    get isAdmin(): boolean {
        return this.users.isAdmin;
    }

    get canEdit(): boolean {
        return this.isAdmin || this.isOwner;
    }

    get canDelete(): boolean {
        return this.isAdmin || (this.isOwner && moment(this.reservation.start).isAfter(moment()));
    }

    deleteReservation() {
        this.alertCtrl.create({
            title: this.translate.get('RESERVATION_CARD.DELETE.TITLE', this.reservation),
            subTitle: this.translate.get('RESERVATION_CARD.DELETE.SUB_TITLE', this.reservation),
            buttons: [
                {
                    text: this.translate.get('RESERVATION_CARD.DELETE.NO'),
                    role: 'cancel'
                },
                {
                    text: this.translate.get('RESERVATION_CARD.DELETE.YES'),
                    handler: () => {
                        this.reservationsService.remove(this.reservation._id, (err) => {
                            if (err) {
                                this.toast.create({
                                    message: this.translateHelper.getError(err),
                                    duration: 2500
                                }).present();
                            }
                        });
                    }
                }
            ]
        }).present();
    }
}
