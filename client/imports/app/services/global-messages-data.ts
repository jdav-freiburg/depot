import {Injectable, NgZone} from "@angular/core";
import {ObservableCursor} from "meteor-rxjs";

import * as _ from 'lodash';
import {TranslateOption, TranslateService} from "./translate";
import {colors} from "../colors";
import {GlobalMessage} from "../../../../both/models/global-message.model";
import {GlobalMessageCollection} from "../../../../both/collections/global-message.collection";

@Injectable()
export class GlobalMessagesDataService {
    private messages: ObservableCursor<GlobalMessage>;

    constructor(private ngZone: NgZone, private translate: TranslateService) {
        Tracker.autorun(() => {
            Meteor.subscribe('globalMessages');
        });
        this.messages = GlobalMessageCollection.find({});
    }

    get messageTypeOptions(): TranslateOption[] {
        return this.translate.getAll([
            {
                translate: 'MESSAGE.TYPE.NEW_USER',
                value: "new-user",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
            {
                translate: 'MESSAGE.TYPE.MESSAGE',
                value: "message",
                color: 'good',
                colorCss: colors.good,
                text: ""
            },
        ]);
    }

    public getMessages(): ObservableCursor<GlobalMessage> {
        return this.messages;
    }

    public createMessage(message: string, callback?: Function) {
        Meteor.call('globalMessages.create', {message: message}, (err, result) => {
            this.ngZone.run(() => {
                callback(err, result);
            })
        });
    }
}
