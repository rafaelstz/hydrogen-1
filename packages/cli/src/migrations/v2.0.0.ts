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
  return j(file.source)
    .find(j.Identifier)
    .replaceWith((p) => j.identifier(p.node.name.split('').reverse().join('')))
    .toSource();
}
