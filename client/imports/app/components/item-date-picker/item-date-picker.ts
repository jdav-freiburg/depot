import {Component, forwardRef, HostListener, Input, Renderer, ElementRef, Optional} from "@angular/core";
import template from "./item-date-picker.html";
import style from "./item-date-picker.scss";
import * as _ from "lodash";
import {ModalController} from "ionic-angular";
import * as moment from 'moment';
import {ControlValueAccessor, Form, NG_VALUE_ACCESSOR} from "@angular/forms";
import {ItemStateModal} from "../../pages/item-state-modal/item-state-modal";

@Component({
    selector: "item-date-picker",
    template,
    styles: [ style ],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ItemDatePickerComponent), multi: true },
    ]
})
export class ItemDatePickerComponent implements ControlValueAccessor {
    private onTouchedCallback: () => void = () => {};
    private onChangeCallback: (_: any) => void = () => {};

    @Input('label') _label: string = "";

    @Input() itemId: string = null;
    @Input() showReservations: boolean = false;
    @Input() rangeStart: Date = null;
    @Input() rangeEnd: Date = null;

    @Input() readonly: boolean = false;

    @Input() compact: boolean = false;

    @Input() disabled: boolean = false;

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this._disabled = isDisabled;
    }

    writeValue(obj: any): void {
        let value = moment(obj);
        if (value.isValid()) {
            this.dateValue = value.toDate();
        } else {
            this.dateValue = null;
        }
    }

    dateValue: Date = new Date();
    _disabled: boolean = false;

    get _text(): string {
        let value = moment(this.dateValue);
        if (value.isValid()) {
            return value.format('L');
        }
        return "";
    }

    get date() {
        return this.dateValue;
    }
    set date(date: Date) {
        let value = moment(date);
        if (value.isValid()) {
            this.dateValue = value.toDate();
        } else {
            this.dateValue = null;
        }
        if (this.onChangeCallback) {
            this.onChangeCallback(this.dateValue);
        }
    }

    constructor(private modalCtrl: ModalController) {
    }

    click(ev: UIEvent) {
        // do not continue if the click event came from a form submit
        if (ev.detail === 0) {
            return;
        }
        ev.preventDefault();
        ev.stopPropagation();
        this.open();
    }

    tap(ev: UIEvent) {
        ev.preventDefault();
        this.open();
    }

    @HostListener('keyup.space', ['$event'])
    keySpace(ev: KeyboardEvent) {
        ev.preventDefault();
        ev.stopPropagation();
        this.open();
    }

    open() {
        if (this._disabled || this.disabled) {
            return;
        }
        let modalView = this.modalCtrl.create(ItemStateModal, {
            date: this.date,
            showReservations: this.showReservations,
            itemId: this.itemId,
            rangeStart: this.rangeStart,
            rangeEnd: this.rangeEnd,
            selectDate: true,
            canSelect: !this.readonly
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                this.date = data.date;
            }
        });
        modalView.present();
    }
}
