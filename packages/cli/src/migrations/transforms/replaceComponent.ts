import type {ASTNode, Collection, JSCodeshift} from 'jscodeshift';

import type {MigrationOptions} from '../v2.0.0.js';

export function replaceComponent<NodeType = ASTNode>(
  j: JSCodeshift,
  source: Collection<NodeType>,
  options: MigrationOptions,
) {
  console.log('replaceComponent');
}
