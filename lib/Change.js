import jsonop from 'jsonop';
import OrderedArray from './OrderedArray';
import RangeArray from './RangeArray';
import { keyToSlice } from './keyslice';

export default class Change {
	constructor(changes) {
		if (changes) this.put(changes);
	}

	arrayOrder(s) {
		return (s.join || s.link) ? [ s.type, s.order ] : [ s.order ];
	}

	put (changes) {
		changes = jsonop({}, changes);

		if (changes.knowledge && Object.keys(changes.knowledge).length) {
			this.knowledge = this.knowledge || {};
			if (changes.indexes && Object.keys(changes.indexes).length) {
				this.indexes = this.indexes || {};
			}

			for (const key in changes.knowledge) {
				const slice = keyToSlice(key);

				if (!this.knowledge[key]) {
					this.knowledge[key] = new RangeArray(changes.knowledge[key]);

					if (changes.indexes && changes.indexes[key]) {
						this.indexes[key] = new OrderedArray(
							this.arrayOrder(slice),
							changes.indexes[key]
						);
					}
				} else {
					for (const range of changes.knowledge[key]) {
						this.knowledge[key].add(range);
						if (changes.indexes && changes.indexes[key]) {
							this.indexes[key].splice(
								...range,
								new OrderedArray(
									this.arrayOrder(slice),
									changes.indexes[key]
								).slice(...range)
							);
						}
					}
				}
			}
		}

		if (changes.queries && Object.keys(changes.queries).length) {
			this.queries = this.queries || {};
			for (const key in changes.queries) {
				if (key === "entities") {
					this.queries.entities = this.queries.entities || {};
					jsonop(this.queries.entities, changes.queries.entities);
					continue;
				}

				if (!this.queries[key]) {
					this.queries[key] = new RangeArray(changes.queries[key]);
				} else {
					for (const range of changes.queries[key]) {
						this.queries[key].add(range);
					}
				}
			}
		}

		delete changes.knowledge;
		delete changes.indexes;
		delete changes.queries;

		jsonop(this, changes);
	}
}