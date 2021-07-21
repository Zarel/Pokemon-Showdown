/**
 * SQL transactions for the modlog.
 */

import type {TransactionEnvironment} from '../../lib/sql';
import type {TransactionArguments} from '.';

export const transactions = {
	insertion: (args: TransactionArguments, env: TransactionEnvironment) => {
		const modlogInsertion = env.statementsMap.get(args.modlogInsertionStatement);
		const altsInsertion = env.statementsMap.get(args.altsInsertionStatement);
		if (!modlogInsertion) {
			throw new Error(`Couldn't find prepared statement for provided value (args.modlogInsertionStatement=${args.modlogInsertionStatement}`);
		}
		if (!altsInsertion) {
			throw new Error(`Couldn't find prepared statement for provided value (args.altsInsertionStatement=${args.altsInsertionStatement}`);
		}

		for (const entry of args.entries) {
			// SQLite doesn't have a boolean type, so this is a workaround.
			entry.isGlobal = Number(entry.isGlobal) as any;
			const result = modlogInsertion.run(entry);
			const rowid = result.lastInsertRowid as number;

			for (const alt of entry.alts || []) {
				altsInsertion.run(rowid, alt);
			}
		}
	},
};
