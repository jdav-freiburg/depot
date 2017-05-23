import { MongoObservable } from "meteor-rxjs";
import {Token} from "../models/token.model";

export const TokenCollection = new MongoObservable.Collection<Token>("token");
