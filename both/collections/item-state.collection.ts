import { MongoObservable } from "meteor-rxjs";
import {ItemState} from "../models/item-state.model";

export const ItemStateCollection = new MongoObservable.Collection<ItemState>("itemStates");
