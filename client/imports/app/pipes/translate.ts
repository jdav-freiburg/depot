import {Pipe, PipeTransform} from "@angular/core";
import {TranslateService} from "../services/translate";

@Pipe({
    name: 'translate',
    pure: false
})
export class TranslatePipe implements PipeTransform {
    constructor(private translate: TranslateService) {

    }

    transform(value: string, args: any): string {
        return this.translate.get(value, args);
    }
}