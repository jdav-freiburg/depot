import {Directive} from "@angular/core";
import {AbstractControl, NG_VALIDATORS, ValidationErrors, Validator} from "@angular/forms";
import SimpleSchema from "simpl-schema";
import * as _ from 'lodash';

@Directive({
    selector: '[advancedEmail]',
    providers: [{provide: NG_VALIDATORS, useExisting: AdvancedEmailValidatorDirective, multi: true}]
})
export class AdvancedEmailValidatorDirective implements Validator {
    validate(control: AbstractControl): ValidationErrors | null {
        return AdvancedEmailValidatorDirective.validator(control);
    }

    public static validator(control: AbstractControl): ValidationErrors | null {
        if (!AdvancedEmailValidatorDirective.check(control)) {
            return { "email": {value: control.value} };
        }
        return null;
    }

    public static check(control: AbstractControl|string): boolean {
        if(_.isString(control)) {
            return SimpleSchema.RegEx.EmailWithTLD.test(control);
        }
        if (control && control.value) {
            return SimpleSchema.RegEx.EmailWithTLD.test(control.value);
        }
        return false;
    }
}