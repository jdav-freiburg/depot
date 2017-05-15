import { MongoObservable } from "meteor-rxjs";
import {GlobalMessage} from "../models/global-message.model";

export const GlobalMessageCollection = new MongoObservable.Collection<GlobalMessage>("globalMessages");
