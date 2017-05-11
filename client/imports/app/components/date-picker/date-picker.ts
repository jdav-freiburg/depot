import {Component, forwardRef, HostListener, Input, Renderer, ElementRef, Optional} from "@angular/core";
import template from "./date-picker.html";
import style from "./date-picker.scss";
import * as _ from "lodash";
import {ModalController} from "ionic-angular";
import * as moment from 'moment';
import {DatePickerModal} from "../date-picker-modal/date-picker-modal";
import {ControlValueAccessor, Form, NG_VALUE_ACCESSOR} from "@angular/forms";

@Component({
    selector: "my-date-picker",
    template,
    styles: [ style ],
    providers: [
        { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DatePickerComponent), multi: true },
    ]
})
export class DatePickerComponent implements ControlValueAccessor {
    private onTouchedCallback: () => void = () => {};
    private onChangeCallback: (_: any) => void = () => {};

    @Input('label') _label: string = "";

    @Input() rangeStart: Date = null;
    @Input() rangeEnd: Date = null;
    @Input() rangeDirection: string = "start";

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
        this.dateValue = moment(date).toDate();
        this.onChangeCallback(this.dateValue);
        this._text = moment(this.dateValue).format('L');
    }

    constructor(
        private modalCtrl: ModalController
    ) {
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

    @HostListener('keyup.space')
    _keyup() {
        this.open();
    }

    open() {
        if (this._disabled) {
            return;
        }
        console.log("openPicker:", this.date);
        let modalView = this.modalCtrl.create(DatePickerModal, {
            date: this.date,
            rangeStart: this.rangeStart,
            rangeEnd: this.rangeEnd,
            rangeDirection: this.rangeDirection
        });
        modalView.onDidDismiss((data) => {
            if (data) {
                this.date = data.date;
            }
        });
        modalView.present();
    }
}
