import type {API, FileInfo, Options} from 'jscodeshift';

import {hasImportDeclaration} from './utils/imports.js';
import {replaceComponent} from './transforms/replaceComponent.js';

export interface MigrationOptions extends Options {
  relative: boolean;
}

export default function v2(
  file: FileInfo,
  {jscodeshift: j}: API,
  options: MigrationOptions,
) {
  // const source = j(file.source);

  // if (
  //   !options.relative &&
  //   !hasImportDeclaration(j, source, '@shopify/hydrogen')
  // ) {
  //   return file.source;
  // }

  // replaceComponent(j, source, options);

  // return source.toSource();
  return '';
}
