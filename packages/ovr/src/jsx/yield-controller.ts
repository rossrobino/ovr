export class YieldController {
	count = 0;

	maybeYield() {
		if (++this.count % 50 === 0) {
			return new Promise((res) => setImmediate(res));
		}
	}
}
