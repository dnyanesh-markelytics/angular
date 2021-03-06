/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import './ng_dev_mode';

import {ChangeDetectionStrategy} from '../change_detection/constants';
import {Provider} from '../di/provider';
import {NgModuleDef, NgModuleDefInternal} from '../metadata/ng_module';
import {ViewEncapsulation} from '../metadata/view';
import {Type} from '../type';

import {BaseDef, ComponentDefFeature, ComponentDefInternal, ComponentQuery, ComponentTemplate, ComponentType, DirectiveDefFeature, DirectiveDefInternal, DirectiveType, DirectiveTypesOrFactory, PipeDefInternal, PipeType, PipeTypesOrFactory} from './interfaces/definition';
import {CssSelectorList, SelectorFlags} from './interfaces/projection';

const EMPTY: {} = {};
const EMPTY_ARRAY: any[] = [];
if (typeof ngDevMode !== 'undefined' && ngDevMode) {
  Object.freeze(EMPTY);
  Object.freeze(EMPTY_ARRAY);
}
let _renderCompCount = 0;

/**
 * Create a component definition object.
 *
 *
 * # Example
 * ```
 * class MyDirective {
 *   // Generated by Angular Template Compiler
 *   // [Symbol] syntax will not be supported by TypeScript until v2.7
 *   static ngComponentDef = defineComponent({
 *     ...
 *   });
 * }
 * ```
 */
export function defineComponent<T>(componentDefinition: {
  /**
   * Directive type, needed to configure the injector.
   */
  type: Type<T>;

  /** The selectors that will be used to match nodes to this component. */
  selectors: CssSelectorList;

  /**
   * Factory method used to create an instance of directive.
   */
  factory: () => T;

  /**
   * The number of nodes, local refs, and pipes in this component template.
   *
   * Used to calculate the length of this component's LViewData array, so we
   * can pre-fill the array and set the binding start index.
   */
  // TODO(kara): remove queries from this count
  consts: number;

  /**
   * The number of bindings in this component template (including pure fn bindings).
   *
   * Used to calculate the length of this component's LViewData array, so we
   * can pre-fill the array and set the host binding start index.
   */
  vars: number;

  /**
   * The number of host bindings (including pure fn bindings) in this component.
   *
   * Used to calculate the length of the LViewData array for the *parent* component
   * of this component.
   */
  hostVars?: number;

  /**
   * Static attributes to set on host element.
   *
   * Even indices: attribute name
   * Odd indices: attribute value
   */
  attributes?: string[];

  /**
   * A map of input names.
   *
   * The format is in: `{[actualPropertyName: string]:(string|[string, string])}`.
   *
   * Given:
   * ```
   * class MyComponent {
   *   @Input()
   *   publicInput1: string;
   *
   *   @Input('publicInput2')
   *   declaredInput2: string;
   * }
   * ```
   *
   * is described as:
   * ```
   * {
   *   publicInput1: 'publicInput1',
   *   declaredInput2: ['declaredInput2', 'publicInput2'],
   * }
   * ```
   *
   * Which the minifier may translate to:
   * ```
   * {
   *   minifiedPublicInput1: 'publicInput1',
   *   minifiedDeclaredInput2: [ 'publicInput2', 'declaredInput2'],
   * }
   * ```
   *
   * This allows the render to re-construct the minified, public, and declared names
   * of properties.
   *
   * NOTE:
   *  - Because declared and public name are usually same we only generate the array
   *    `['declared', 'public']` format when they differ.
   *  - The reason why this API and `outputs` API is not the same is that `NgOnChanges` has
   *    inconsistent behavior in that it uses declared names rather than minified or public. For
   *    this reason `NgOnChanges` will be deprecated and removed in future version and this
   *    API will be simplified to be consistent with `output`.
   */
  inputs?: {[P in keyof T]?: string | [string, string]};

  /**
   * A map of output names.
   *
   * The format is in: `{[actualPropertyName: string]:string}`.
   *
   * Which the minifier may translate to: `{[minifiedPropertyName: string]:string}`.
   *
   * This allows the render to re-construct the minified and non-minified names
   * of properties.
   */
  outputs?: {[P in keyof T]?: string};

  /**
   * Function executed by the parent template to allow child directive to apply host bindings.
   */
  hostBindings?: (directiveIndex: number, elementIndex: number) => void;

  /**
   * Function to create instances of content queries associated with a given directive.
   */
  contentQueries?: (() => void);

  /** Refreshes content queries associated with directives in a given view */
  contentQueriesRefresh?: ((directiveIndex: number, queryIndex: number) => void);

  /**
   * Defines the name that can be used in the template to assign this directive to a variable.
   *
   * See: {@link Directive.exportAs}
   */
  exportAs?: string;

  /**
   * Template function use for rendering DOM.
   *
   * This function has following structure.
   *
   * ```
   * function Template<T>(ctx:T, creationMode: boolean) {
   *   if (creationMode) {
   *     // Contains creation mode instructions.
   *   }
   *   // Contains binding update instructions
   * }
   * ```
   *
   * Common instructions are:
   * Creation mode instructions:
   *  - `elementStart`, `elementEnd`
   *  - `text`
   *  - `container`
   *  - `listener`
   *
   * Binding update instructions:
   * - `bind`
   * - `elementAttribute`
   * - `elementProperty`
   * - `elementClass`
   * - `elementStyle`
   *
   */
  template: ComponentTemplate<T>;

  /**
   * Additional set of instructions specific to view query processing. This could be seen as a
   * set of instruction to be inserted into the template function.
   *
   * Query-related instructions need to be pulled out to a specific function as a timing of
   * execution is different as compared to all other instructions (after change detection hooks but
   * before view hooks).
   */
  viewQuery?: ComponentQuery<T>| null;

  /**
   * A list of optional features to apply.
   *
   * See: {@link NgOnChangesFeature}, {@link PublicFeature}
   */
  features?: ComponentDefFeature[];

  /**
   * Defines template and style encapsulation options available for Component's {@link Component}.
   */
  encapsulation?: ViewEncapsulation;

  /**
   * Defines arbitrary developer-defined data to be stored on a renderer instance.
   * This is useful for renderers that delegate to other renderers.
   *
   * see: animation
   */
  data?: {[kind: string]: any};

  /**
   * A set of styles that the component needs to be present for component to render correctly.
   */
  styles?: string[];

  /**
   * The strategy that the default change detector uses to detect changes.
   * When set, takes effect the next time change detection is triggered.
   */
  changeDetection?: ChangeDetectionStrategy;

  /**
   * Defines the set of injectable objects that are visible to a Directive and its light DOM
   * children.
   */
  providers?: Provider[];

  /**
   * Defines the set of injectable objects that are visible to its view DOM children.
   */
  viewProviders?: Provider[];

  /**
   * Registry of directives and components that may be found in this component's view.
   *
   * The property is either an array of `DirectiveDef`s or a function which returns the array of
   * `DirectiveDef`s. The function is necessary to be able to support forward declarations.
   */
  directives?: DirectiveTypesOrFactory | null;

  /**
   * Registry of pipes that may be found in this component's view.
   *
   * The property is either an array of `PipeDefs`s or a function which returns the array of
   * `PipeDefs`s. The function is necessary to be able to support forward declarations.
   */
  pipes?: PipeTypesOrFactory | null;
}): never {
  const type = componentDefinition.type;
  const pipeTypes = componentDefinition.pipes !;
  const directiveTypes = componentDefinition.directives !;
  const declaredInputs: {[key: string]: string} = {} as any;
  const encapsulation = componentDefinition.encapsulation || ViewEncapsulation.Emulated;
  const styles: string[] = componentDefinition.styles || EMPTY_ARRAY;
  const def: ComponentDefInternal<any> = {
    type: type,
    diPublic: null,
    consts: componentDefinition.consts,
    vars: componentDefinition.vars,
    hostVars: componentDefinition.hostVars || 0,
    factory: componentDefinition.factory,
    template: componentDefinition.template || null !,
    hostBindings: componentDefinition.hostBindings || null,
    contentQueries: componentDefinition.contentQueries || null,
    contentQueriesRefresh: componentDefinition.contentQueriesRefresh || null,
    attributes: componentDefinition.attributes || null,
    inputs: invertObject(componentDefinition.inputs, declaredInputs),
    declaredInputs: declaredInputs,
    outputs: invertObject(componentDefinition.outputs),
    exportAs: componentDefinition.exportAs || null,
    onInit: type.prototype.ngOnInit || null,
    doCheck: type.prototype.ngDoCheck || null,
    afterContentInit: type.prototype.ngAfterContentInit || null,
    afterContentChecked: type.prototype.ngAfterContentChecked || null,
    afterViewInit: type.prototype.ngAfterViewInit || null,
    afterViewChecked: type.prototype.ngAfterViewChecked || null,
    onDestroy: type.prototype.ngOnDestroy || null,
    onPush: componentDefinition.changeDetection === ChangeDetectionStrategy.OnPush,
    directiveDefs: directiveTypes ?
        () => (typeof directiveTypes === 'function' ? directiveTypes() : directiveTypes)
                  .map(extractDirectiveDef) :
        null,
    pipeDefs: pipeTypes ?
        () => (typeof pipeTypes === 'function' ? pipeTypes() : pipeTypes).map(extractPipeDef) :
        null,
    selectors: componentDefinition.selectors,
    viewQuery: componentDefinition.viewQuery || null,
    features: componentDefinition.features || null,
    data: componentDefinition.data || EMPTY,
    // TODO(misko): convert ViewEncapsulation into const enum so that it can be used directly in the
    // next line. Also `None` should be 0 not 2.
    encapsulation,
    providers: EMPTY_ARRAY,
    viewProviders: EMPTY_ARRAY,
    id: `c${_renderCompCount++}`, styles,
  };
  const feature = componentDefinition.features;
  feature && feature.forEach((fn) => fn(def));
  return def as never;
}

export function extractDirectiveDef(type: DirectiveType<any>& ComponentType<any>):
    DirectiveDefInternal<any>|ComponentDefInternal<any> {
  const def = type.ngComponentDef || type.ngDirectiveDef;
  if (ngDevMode && !def) {
    throw new Error(`'${type.name}' is neither 'ComponentType' or 'DirectiveType'.`);
  }
  return def;
}

export function extractPipeDef(type: PipeType<any>): PipeDefInternal<any> {
  const def = type.ngPipeDef;
  if (ngDevMode && !def) {
    throw new Error(`'${type.name}' is not a 'PipeType'.`);
  }
  return def;
}

export function defineNgModule<T>(def: {type: T} & Partial<NgModuleDef<T, any, any, any>>): never {
  const res: NgModuleDefInternal<T> = {
    type: def.type,
    bootstrap: def.bootstrap || EMPTY_ARRAY,
    declarations: def.declarations || EMPTY_ARRAY,
    imports: def.imports || EMPTY_ARRAY,
    exports: def.exports || EMPTY_ARRAY,
    transitiveCompileScopes: null,
  };
  return res as never;
}

/**
 * Inverts an inputs or outputs lookup such that the keys, which were the
 * minified keys, are part of the values, and the values are parsed so that
 * the publicName of the property is the new key
 *
 * e.g. for
 *
 * ```
 * class Comp {
 *   @Input()
 *   propName1: string;
 *
 *   @Input('publicName')
 *   propName2: number;
 * }
 * ```
 *
 * will be serialized as
 *
 * ```
 * {
 *   a0: 'propName1',
 *   b1: ['publicName', 'propName2'],
 * }
 * ```
 *
 * becomes
 *
 * ```
 * {
 *  'propName1': 'a0',
 *  'publicName': 'b1'
 * }
 * ```
 *
 * Optionally the function can take `secondary` which will result in:
 *
 * ```
 * {
 *  'propName1': 'a0',
 *  'propName2': 'b1'
 * }
 * ```
 *

 */
function invertObject(obj: any, secondary?: any): any {
  if (obj == null) return EMPTY;
  const newLookup: any = {};
  for (const minifiedKey in obj) {
    if (obj.hasOwnProperty(minifiedKey)) {
      let publicName = obj[minifiedKey];
      let declaredName = publicName;
      if (Array.isArray(publicName)) {
        declaredName = publicName[1];
        publicName = publicName[0];
      }
      newLookup[publicName] = minifiedKey;
      if (secondary) {
        (secondary[declaredName] = minifiedKey);
      }
    }
  }
  return newLookup;
}

/**
 * Create a base definition
 *
 * # Example
 * ```
 * class ShouldBeInherited {
 *   static ngBaseDef = defineBase({
 *      ...
 *   })
 * }
 * @param baseDefinition The base definition parameters
 */
export function defineBase<T>(baseDefinition: {
  /**
   * A map of input names.
   *
   * The format is in: `{[actualPropertyName: string]:(string|[string, string])}`.
   *
   * Given:
   * ```
   * class MyComponent {
   *   @Input()
   *   publicInput1: string;
   *
   *   @Input('publicInput2')
   *   declaredInput2: string;
   * }
   * ```
   *
   * is described as:
   * ```
   * {
   *   publicInput1: 'publicInput1',
   *   declaredInput2: ['declaredInput2', 'publicInput2'],
   * }
   * ```
   *
   * Which the minifier may translate to:
   * ```
   * {
   *   minifiedPublicInput1: 'publicInput1',
   *   minifiedDeclaredInput2: [ 'declaredInput2', 'publicInput2'],
   * }
   * ```
   *
   * This allows the render to re-construct the minified, public, and declared names
   * of properties.
   *
   * NOTE:
   *  - Because declared and public name are usually same we only generate the array
   *    `['declared', 'public']` format when they differ.
   *  - The reason why this API and `outputs` API is not the same is that `NgOnChanges` has
   *    inconsistent behavior in that it uses declared names rather than minified or public. For
   *    this reason `NgOnChanges` will be deprecated and removed in future version and this
   *    API will be simplified to be consistent with `outputs`.
   */
  inputs?: {[P in keyof T]?: string | [string, string]};

  /**
   * A map of output names.
   *
   * The format is in: `{[actualPropertyName: string]:string}`.
   *
   * Which the minifier may translate to: `{[minifiedPropertyName: string]:string}`.
   *
   * This allows the render to re-construct the minified and non-minified names
   * of properties.
   */
  outputs?: {[P in keyof T]?: string};
}): BaseDef<T> {
  const declaredInputs: {[P in keyof T]: P} = {} as any;
  return {
    inputs: invertObject(baseDefinition.inputs, declaredInputs),
    declaredInputs: declaredInputs,
    outputs: invertObject(baseDefinition.outputs),
  };
}

/**
 * Create a directive definition object.
 *
 * # Example
 * ```
 * class MyDirective {
 *   // Generated by Angular Template Compiler
 *   // [Symbol] syntax will not be supported by TypeScript until v2.7
 *   static ngDirectiveDef = defineDirective({
 *     ...
 *   });
 * }
 * ```
 */
export const defineDirective = defineComponent as any as<T>(directiveDefinition: {
  /**
   * Directive type, needed to configure the injector.
   */
  type: Type<T>;

  /** The selectors that will be used to match nodes to this directive. */
  selectors: CssSelectorList;

  /**
   * Factory method used to create an instance of directive.
   */
  factory: () => T;

  /**
   * Static attributes to set on host element.
   *
   * Even indices: attribute name
   * Odd indices: attribute value
   */
  attributes?: string[];

  /**
   * A map of input names.
   *
   * The format is in: `{[actualPropertyName: string]:(string|[string, string])}`.
   *
   * Given:
   * ```
   * class MyComponent {
   *   @Input()
   *   publicInput1: string;
   *
   *   @Input('publicInput2')
   *   declaredInput2: string;
   * }
   * ```
   *
   * is described as:
   * ```
   * {
   *   publicInput1: 'publicInput1',
   *   declaredInput2: ['declaredInput2', 'publicInput2'],
   * }
   * ```
   *
   * Which the minifier may translate to:
   * ```
   * {
   *   minifiedPublicInput1: 'publicInput1',
   *   minifiedDeclaredInput2: [ 'publicInput2', 'declaredInput2'],
   * }
   * ```
   *
   * This allows the render to re-construct the minified, public, and declared names
   * of properties.
   *
   * NOTE:
   *  - Because declared and public name are usually same we only generate the array
   *    `['declared', 'public']` format when they differ.
   *  - The reason why this API and `outputs` API is not the same is that `NgOnChanges` has
   *    inconsistent behavior in that it uses declared names rather than minified or public. For
   *    this reason `NgOnChanges` will be deprecated and removed in future version and this
   *    API will be simplified to be consistent with `output`.
   */
  inputs?: {[P in keyof T]?: string | [string, string]};

  /**
   * A map of output names.
   *
   * The format is in: `{[actualPropertyName: string]:string}`.
   *
   * Which the minifier may translate to: `{[minifiedPropertyName: string]:string}`.
   *
   * This allows the render to re-construct the minified and non-minified names
   * of properties.
   */
  outputs?: {[P in keyof T]?: string};

  /**
   * A list of optional features to apply.
   *
   * See: {@link NgOnChangesFeature}, {@link PublicFeature}, {@link InheritDefinitionFeature}
   */
  features?: DirectiveDefFeature[];

  /**
   * The number of host bindings (including pure fn bindings) in this directive.
   *
   * Used to calculate the length of the LViewData array for the *parent* component
   * of this directive.
   */
  hostVars?: number;

  /**
   * Function executed by the parent template to allow child directive to apply host bindings.
   */
  hostBindings?: (directiveIndex: number, elementIndex: number) => void;

  /**
   * Function to create instances of content queries associated with a given directive.
   */
  contentQueries?: (() => void);

  /** Refreshes content queries associated with directives in a given view */
  contentQueriesRefresh?: ((directiveIndex: number, queryIndex: number) => void);

  /**
   * Defines the name that can be used in the template to assign this directive to a variable.
   *
   * See: {@link Directive.exportAs}
   */
  exportAs?: string;
}) => never;

/**
 * Create a pipe definition object.
 *
 * # Example
 * ```
 * class MyPipe implements PipeTransform {
 *   // Generated by Angular Template Compiler
 *   static ngPipeDef = definePipe({
 *     ...
 *   });
 * }
 * ```
 * @param pipeDef Pipe definition generated by the compiler
 */
export function definePipe<T>(pipeDef: {
  /** Name of the pipe. Used for matching pipes in template to pipe defs. */
  name: string,

  /** Pipe class reference. Needed to extract pipe lifecycle hooks. */
  type: Type<T>,

  /** A factory for creating a pipe instance. */
  factory: () => T,

  /** Whether the pipe is pure. */
  pure?: boolean
}): never {
  return (<PipeDefInternal<T>>{
    name: pipeDef.name,
    factory: pipeDef.factory,
    pure: pipeDef.pure !== false,
    onDestroy: pipeDef.type.prototype.ngOnDestroy || null
  }) as never;
}
