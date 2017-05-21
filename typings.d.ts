/// <reference types="zone.js" />
/// <reference types="@types/meteor" />
/// <reference types="@types/lodash" />
/// <reference types="@types/chai" />
/// <reference types="@types/mocha" />
/// <reference types="@types/babyparse" />

declare module "*.html" {
  const template: string;
  export default template;
}

declare module "*.scss" {
  const style: string;
  export default style;
}

declare module "*.less" {
  const style: string;
  export default style;
}

declare module "*.css" {
  const style: string;
  export default style;
}

declare module "*.sass" {
  const style: string;
  export default style;
}

declare module "chai-spies" {
  const chaiSpies: (chai: any, utils: any) => void;

  export = chaiSpies;
}

interface SpyCalledWith extends Chai.Assertion {
  (...args: any[]): void;
  exactly(...args: any[]): void;
}

interface SpyCalledAlways extends Chai.Assertion {
  with: SpyCalledWith;
}

interface SpyCalledAt {
  most(n: number): void;
  least(n: number): void;
}

interface SpyCalled {
  (n?: number): void;
  /**
   * Assert that a spy has been called exactly once
   *
   * @api public
   */
  once: any;
  /**
   * Assert that a spy has been called exactly twice.
   *
   * @api public
   */
  twice: any;
  /**
   * Assert that a spy has been called exactly `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  exactly(n: number): void;
  with: SpyCalledWith;
  /**
   * Assert that a spy has been called `n` or more times.
   *
   * @param {Number} n times
   * @api public
   */
  min(n: number): void;
  /**
   * Assert that a spy has been called `n` or fewer times.
   *
   * @param {Number} n times
   * @api public
   */
  max(n: number): void;
  at: SpyCalledAt;
  above(n: number): void;
  /**
   * Assert that a spy has been called more than `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  gt(n: number): void;
  below(n: number): void;
  /**
   * Assert that a spy has been called less than `n` times.
   *
   * @param {Number} n times
   * @api public
   */
  lt(n: number): void;
}

declare namespace Chai {
  interface ChaiStatic {
    spy(): any;
  }

  interface Assertion {
    called: SpyCalled;
    always: SpyCalledAlways;
  }
}

declare module "simpl-schema" {

  export class ValidationContext {
    constructor(ss: any);
    addValidationErrors(errors: any): void;
    clean(...args: any[]): any;
    getErrorForKey(key: any, ...args: any[]): any;
    isValid(): any;
    keyErrorMessage(key: any, ...args: any[]): any;
    keyIsInvalid(key: any, ...args: any[]): any;
    reset(): void;
    setValidationErrors(errors: any): void;
    validate(obj: any, ...args: any[]): any;
    validationErrors(): any;
  }

  interface SchemaDefinition {
    type: any;
    label?: string | Function;
    optional?: boolean | Function;
    min?: number | boolean | Date | Function;
    max?: number | boolean | Date | Function;
    minCount?: number | Function;
    maxCount?: number | Function;
    allowedValues?: any[] | Function;
    decimal?: boolean;
    exclusiveMax?: boolean;
    exclusiveMin?: boolean;
    regEx?: RegExp | RegExp[];
    custom?: Function;
    blackbox?: boolean;
    autoValue?: Function;
    defaultValue?: any;
    trim?: boolean;
  }

  interface CleanOption {
    filter?: boolean;
    autoConvert?: boolean;
    removeEmptyStrings?: boolean;
    trimStrings?: boolean;
    getAutoValues?: boolean;
    isModifier?: boolean;
    extendAutoValueContext?: boolean;
  }

  interface SimpleSchemaStatic {
    new(schema: {[key: string]: SchemaDefinition | any} | any[]): SimpleSchemaStatic;
    namedContext(name?: string): SimpleSchemaValidationContextStatic;
    addValidator(validator: Function): any;
    pick(...fields: string[]): SimpleSchemaStatic;
    omit(...fields: string[]): SimpleSchemaStatic;
    clean(doc: any, options?: CleanOption): any;
    schema(key?: string): SchemaDefinition | SchemaDefinition[];
    getDefinition(key: string, propList?: any, functionContext?: any): any;
    keyIsInBlackBox(key: string): boolean;
    labels(labels: {[key: string]: string}): void;
    label(key: any): any;
    Integer: RegExp;
    messages(messages: any): any;
    messageForError(type: any, key: any, def: any, value: any): string;
    allowsKey(key: any): string;
    newContext(): SimpleSchemaValidationContextStatic;
    objectKeys(keyPrefix: any): any[];
    validate(obj: any, options?: ValidationOption): void;
    validator(options: ValidationOption): Function;
    extend(otherSchema: SimpleSchemaStatic): SimpleSchemaStatic;
    RegEx: {
      Email: RegExp;
      EmailWithTLD: RegExp;
      Domain: RegExp;
      WeakDomain: RegExp;
      IP: RegExp;
      IPv4: RegExp;
      IPv6: RegExp;
      Url: RegExp;
      Id: RegExp;
      ZipCode: RegExp;
      Phone: RegExp;
    };
  }

  interface ValidationOption {
    modifier?: boolean;
    upsert?: boolean;
    clean?: boolean;
    filter?: boolean;
    upsertextendedCustomContext?: boolean;
  }

  interface SimpleSchemaValidationContextStatic {
    validate(obj: any, options?: ValidationOption): boolean;
    validateOne(doc: any, keyName: string, options?: ValidationOption): boolean;
    resetValidation(): void;
    isValid(): boolean;
    invalidKeys(): { name: string; type: string; value?: any; }[];
    addInvalidKeys(errors: { name: string, type: string; }[]): void;
    keyIsInvalid(name: any): boolean;
    keyErrorMessage(name: any): string;
    getErrorObject(): any;
  }

  interface MongoObjectStatic {
    forEachNode(func: Function, options?: {endPointsOnly: boolean;}): void;
    getValueForPosition(position: string): any;
    setValueForPosition(position: string, value: any): void;
    removeValueForPosition(position: string): void;
    getKeyForPosition(position: string): any;
    getGenericKeyForPosition(position: string): any;
    getInfoForKey(key: string): any;
    getPositionForKey(key: string): string;
    getPositionsForGenericKey(key: string): string[];
    getValueForKey(key: string): any;
    addKey(key: string, val: any, op: string): any;
    removeGenericKeys(keys: string[]): void;
    removeGenericKey(key: string): void;
    removeKey(key: string): void;
    removeKeys(keys: string[]): void;
    filterGenericKeys(test: Function): void;
    setValueForKey(key: string, val: any): void;
    setValueForGenericKey(key: string, val: any): void;
    getObject(): any;
    getFlatObject(options?: {keepArrays?: boolean}): any;
    affectsKey(key: string): any;
    affectsGenericKey(key: string): any;
    affectsGenericKeyImplicit(key: string): any;
  }

  export const SimpleSchema: SimpleSchemaStatic;
  export const SimpleSchemaValidationContext: SimpleSchemaValidationContextStatic;
  export const MongoObject: MongoObjectStatic;

  export interface SimpleSchema {
    debug: boolean;
    addValidator(validator: Function): any;
    extendOptions(options: {[key: string]: any}): void;
    messages(messages: any): void;
    RegEx: {
      Email: RegExp;
      Domain: RegExp;
      WeakDomain: RegExp;
      IP: RegExp;
      IPv4: RegExp;
      IPv6: RegExp;
      Url: RegExp;
      Id: RegExp;
      ZipCode: RegExp;
      Phone: RegExp;
    };
  }

  export interface MongoObject {
    expandKey(val: any, key: string, obj: any): void;
  }

  export default SimpleSchema;
}