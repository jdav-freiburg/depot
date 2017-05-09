import { MongoObservable } from "meteor-rxjs";
import { Item } from "../models/item.model";

export const ItemCollection = new MongoObservable.Collection<Item>("items");
