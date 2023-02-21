import {path, output, file, error} from '@shopify/cli-kit';
import url from 'url';
import {commonFlags} from '../../utils/flags.js';
import {Flags} from '@oclif/core';
import Command from '@shopify/cli-kit/node/base-command';
import {AbortError} from '@shopify/cli-kit/node/error';
import Listr from 'listr';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const MIGRATIONS = ['v2.0.0'];

interface MigrateOptions {
  transform?: string;
  migration?: string;
  path: string;
  dry?: boolean;
  print?: boolean;
  force?: boolean;
}

// @ts-ignore
export default class Migrate extends Command {
  static description =
    'Apply migration steps to upgrade a Hydrogen storefront.';
  static flags = {
    path: commonFlags.path,
    transform: Flags.string(),
    dry: Flags.boolean(),
    print: Flags.boolean(),
    force: Flags.boolean(),
  };

  static args = [
    {
      name: 'migration',
      description: `The migration to apply. One of ${MIGRATIONS.join()}.`,
      required: true,
      options: MIGRATIONS,
      env: 'SHOPIFY_HYDROGEN_ARG_MIGRATION',
    },
  ];

  async run(): Promise<void> {
    debugger;

    // @ts-ignore
    const {flags, args} = await this.parse(Migrate);
    const directory = flags.path ? path.resolve(flags.path) : process.cwd();

    const {migration} = args;

    const migrationFile = path.join(
      __dirname,
      `../../migrations/${migration}.js`,
    );

    if (!(await file.exists(migrationFile))) {
      throw new AbortError(`No migration module found for ${migration}`);
    }
    if (!migrationFile) {
      throw new AbortError(
        `No migration found for ${migration}. Try one of ${MIGRATIONS.join()}.`,
      );
    }

    await runMigration({...flags, ...args, migrationFile, path: directory});
  }
}

export async function runMigration(
  options: {migrationFile: string} & MigrateOptions,
) {
  const {migrationFile} = options;
  const tasks = [
    {
      title: 'Running test migration',
      task: async () => {
        await transform(migrationFile, options);
      },
    },
  ];

  const list = new Listr(tasks);

  await list.run();
}

async function transform(
  migrationFile: string,
  {path: appPath}: MigrateOptions,
) {
  // @ts-expect-error `@types/jscodeshift` doesn't have types for this
  const applyTransform = (await import('jscodeshift/dist/testUtils.js'))
    .applyTransform;
  const transforms = await import(migrationFile);
  const transformOptions = {
    babel: true,
    dry: false,
    extensions: 'tsx,ts,jsx,js',
    failOnError: false,
    ignorePattern: ['**/node_modules/**', '**/.cache/**', '**/build/**'],
    print: true,
    runInBand: true,
    silent: false,
    stdin: false,
    verbose: 2,
  };
  const filepaths = await path.glob([`${appPath}/app/**/*.tsx`]);

  if (filepaths.length === 0) {
    throw new AbortError(`No files found for ${appPath}`);
  }

  for (const fi of filepaths) {
    const source = await file.read(fi);

    if (source === undefined) {
      return;
    }

    if (!fi || !source) {
      throw new AbortError(`No file found for ${fi}`);
    }
    try {
      applyTransform({parser: 'tsx', ...transforms}, transformOptions, {
        source,
        path: fi,
      });
    } catch (error: unknown) {
      throw new AbortError((error as Error).message);
    }
  }
}
