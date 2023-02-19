import {path, output, file, error} from '@shopify/cli-kit';
import url from 'url';
import {commonFlags} from '../../utils/flags.js';
import {Flags} from '@oclif/core';
import Command from '@shopify/cli-kit/node/base-command';
import {AbortError} from '@shopify/cli-kit/node/error';
import Listr from 'listr';
// import * as jscodeshift from 'jscodeshift/src/Runner.js';

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
      title: 'Installing dependencies',
      task: async () => {
        //   await addResolutionOrOverrideIfNeeded(app.directory, extensionFlavor)
        //   const requiredDependencies = getExtensionRuntimeDependencies({specification, extensionFlavor})
        //   await addNPMDependenciesIfNeeded(requiredDependencies, {
        //     packageManager: app.packageManager,
        //     type: 'prod',
        //     directory: app.directory,
        //   })
        // },
        console.log(migrationFile);

        await transform(migrationFile, options);
      },
      // {
      //   title: `Generating ${specification.externalName} extension`,
      //   task: async () => {
      // const templateDirectory =
      //   specification.templatePath ??
      //   (await findPathUp(`templates/ui-extensions/projects/${specification.identifier}`, {
      //     type: 'directory',
      //     cwd: moduleDirectory(import.meta.url),
      //   }))

      // if (!templateDirectory) {
      //   throw new BugError(`Couldn't find the template for '${specification.externalName}'`)
      // }

      // const srcFileExtension = getSrcFileExtension(extensionFlavor ?? 'vanilla-js')
      // await recursiveLiquidTemplateCopy(templateDirectory, extensionDirectory, {
      //   srcFileExtension,
      //   flavor: extensionFlavor ?? '',
      //   type: specification.identifier,
      //   name,
      // })

      // if (extensionFlavor) {
      //   await changeIndexFileExtension(extensionDirectory, srcFileExtension)
      //   await removeUnwantedTemplateFilesPerFlavor(extensionDirectory, extensionFlavor)
      // }
      // },
    },
  ];

  const list = new Listr(tasks);

  await list.run();
}

async function transform(
  migrationFile: string,
  {dry, path: appPath}: MigrateOptions,
) {
  // @ts-expect-error `@types/jscodeshift` doesn't have types for this
  const applyTransform = (await import('jscodeshift/dist/testUtils.js'))
    .applyTransform;

  const transforms = await import(migrationFile);
  const transformOptions = {
    babel: true,
    dry,
    extensions: 'tsx,ts,jsx,js',
    failOnError: false,
    ignorePattern: ['**/node_modules/**', '**/.cache/**', '**/build/**'],
    parser: 'tsx',
    print: true,
    runInBand: true,
    silent: false,
    stdin: false,
    verbose: 2,
  };

  const filepaths = await path.glob([`${appPath}/**/*`]);

  if (filepaths.length === 0) {
    throw new Error(`No files found for ${appPath}`);
  }

  try {
    const output = applyTransform(transforms, transformOptions, 'input');
    // await jscodeshift.run(migrationFile, filepaths, {
    //   babel: true,
    //   ignorePattern: ['**/node_modules/**', '**/.next/**', '**/build/**'],
    //   extensions: 'tsx,ts,jsx,js',
    //   parser: 'tsx',
    //   verbose: 2,
    //   silent: false,
    //   stdin: false,
    // });
    console.log(output);
  } catch (error: unknown) {
    // eslint-disable-next-line no-console
    // console.error(error);
    // process.exit(1);
    throw new AbortError((error as Error).message);
  }
}
