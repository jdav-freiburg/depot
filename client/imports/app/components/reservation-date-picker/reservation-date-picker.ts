import {Component, forwardRef, HostListener, Input, Renderer, ElementRef, Optional} from "@angular/core";
import template from "./reservation-date-picker.html";
import style from "./reservation-date-picker.scss";
import * as _ from "lodash";
import {ModalController} from "ionic-angular";
import * as moment from 'moment';
import {DatePickerModal} from "../../pages/date-picker-modal/date-picker-modal";
import {ControlValueAccessor, Form, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: "reservation-date-picker",
    template,
    styles: [ style ],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ReservationDatePickerComponent), multi: true },
    ]
})
export class ReservationDatePickerComponent implements ControlValueAccessor {
    private onTouchedCallback: () => void = () => {};
    private onChangeCallback: (_: any) => void = () => {};

    @Input('label') _label: string = "";

    @Input() rangeStart: Date = null;
    @Input() rangeEnd: Date = null;
    @Input() rangeDisableOutside: boolean = true;
    @Input() showReservations: boolean = false;
    @Input() skipReservationId: string = null;

    @Input() readonly: boolean = false;

    registerOnChange(fn: any): void {
        this.onChangeCallback = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouchedCallback = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        console.log("disabled:", isDisabled);
        this._disabled = isDisabled;
    }

    writeValue(obj: any): void {
        console.log("value:", obj);
        this.date = moment(obj).toDate();
    }

    dateValue: Date = new Date();
    _text: string = "";
    _disabled: boolean = false;

    get date() {
        return this.dateValue;
    }
    set date(date: Date) {
        let value = moment(date);
        if (value.isValid()) {
            this.dateValue = value.toDate();
            this._text = value.format('L');
        } else {
            this.dateValue = null;
            this._text = "";
        }
        this.onChangeCallback(this.dateValue);
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

    @HostListener('keyup.space', ['$event'])
    keySpace(ev: KeyboardEvent) {
        ev.preventDefault();
        ev.stopPropagation();
        this.open();
    }

    open() {
        if (this._disabled) {
            return;
        }
        let modalView = this.modalCtrl.create(DatePickerModal, {
            date: this.date,
            rangeStart: this.rangeStart,
            rangeEnd: this.rangeEnd,
            rangeDisableOutside: this.rangeDisableOutside,
            showReservations: this.showReservations,
            skipReservationId: this.skipReservationId,
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
