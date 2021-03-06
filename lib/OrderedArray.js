import RangeArray from './RangeArray';

module.exports = class OrderedArray {
	constructor(order, objects) {
		if (objects instanceof OrderedArray) {
			objects = objects.arr.slice(0);
		}

		if (!Array.isArray(objects)) {
			objects = [];
		}

		this.order = order;
		this.arr = objects.slice(0);
		//

		this[Symbol.iterator] = this.arr[Symbol.iterator].bind(this.arr);
		Object.defineProperty(this, 'length', { get: () => this.arr.length });
	}

	/*
		Finds the index of a particular value.
		@param value - What to find
		@param [start=0] - Index position to start at
		@param [end=length] - Index position to end
	*/
	indexOf(value, last) {
		let pos, start = 0, end = this.arr.length;

		if (value === -Infinity) { return start; }
		if (value === +Infinity) { return end; }

		while (start < end) {
			pos = ((start + end) / 2) | 0;
			if (this.arr[pos] && this.valAt(pos) < value) {
				start = pos + 1;
			} else if (this.arr[pos - 1] && this.valAt(pos - 1) >= value) {
				end = pos - 1;
			} else {
				start = pos;
				break;
			}
		}
		if (this.arr[start] && this.valAt(start) === value) {
			let step = last ? 1 : -1;
			while (
				this.arr[start + step] &&
				this.valAt(start + step) === value
			) { start += step; }
		}
		return start;
	}

	forEach(cb) {
		this.arr.forEach(cb);
	}

	valOf(item) {
		let value = item;
		this.order.forEach((prop) => { value = value[prop]; });
		return value;
	}

	valAt(index) {
		if (index < 0 || (index === 0 && this.arr.length === 0)) { return -Infinity; }
		if (index >= this.arr.length) { return +Infinity; }
		return this.valOf(this.arr[index]);
	}

	get(index) {
		if (typeof index !== 'number') return this.arr;
		else return this.arr[index];
	}

	add(object) {
		const val = this.valOf(object),
			pos = this.indexOf(val);

		if (this.arr[pos] && this.valAt(pos) === val) {
			this.arr[pos] = object;
		} else {
			this.arr.splice(pos, 0, object);
		}
	}

	put(object, last) { // last: if multiple entries have the same value, put at end.
		const pos = this.indexOf(this.valOf(object), last);
		this.arr.splice(pos, 0, object);
	}

	delete(value) {
		const pos = this.indexOf(value);

		if (this.valAt(pos) === value) {
			this.arr.splice(pos, 1);
		}
	}

	slice(startValue, before, after) {
		let startPos, endPos;

		if (arguments.length === 2) {
			const endValue = before;
			startPos = this.indexOf(startValue);
			endPos = this.indexOf(endValue, true);
			if (this.valAt(endPos) === endValue && endValue < Infinity) {
				endPos++;
			}
			return new OrderedArray(this.order, this.arr.slice(startPos, endPos));
		} else if (arguments.length === 3) {
			if (before > 0) {
				startPos = this.indexOf(startValue, true);
				if (
					this.valAt(startPos) === startValue &&
					startValue < Infinity
				) { startPos++; }

			} else {
				startPos = this.indexOf(startValue);
			}
			return new OrderedArray(this.order, this.arr.slice(
				Math.max(0, startPos - before),
				Math.min(this.arr.length, startPos + after)
			));
		} else {
			throw Error('SLICE_INVALID_ARGUMENTS');
		}
	}

	splice(startValue, endValue, objects) {
		let startIndex = this.indexOf(startValue),
			endIndex = this.indexOf(endValue, true);

		if (this.valAt(endIndex) === endValue && endValue < Infinity) {
			endIndex++;
		}

		if (objects instanceof OrderedArray) {
			return new OrderedArray(this.order, this.arr.splice(
				startIndex, endIndex - startIndex, ...objects.arr
			));
		} else {
			return new OrderedArray(this.order, this.arr.splice(
				startIndex, endIndex - startIndex
			));
		}
	}

	getRange() {
		if (this.arr.length === 0) return new RangeArray([ [ -Infinity, +Infinity ] ]);
		return new RangeArray([ [
			this.valAt(0), this.valAt(this.arr.length - 1)
		] ]);
	}

	packArguments() {
		return [ this.order, this.arr ];
	}
};
